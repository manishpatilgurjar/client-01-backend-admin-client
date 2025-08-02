import { Injectable } from '@nestjs/common';
const nodemailer = require('nodemailer');
import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import { SiteSettingsService } from '../admin/services/site-settings.service';

/**
 * Service for sending emails using Google SMTP.
 * Reads credentials from environment variables:
 * - GMAIL_USER: Gmail address
 * - GMAIL_PASS: Gmail app password
 * - LOCATIONIQ_API_KEY: LocationIQ API key
 */
@Injectable()
export class MailService {
  constructor(private readonly siteSettingsService: SiteSettingsService) {
    // Add global error handler for the transporter
    this.transporter.on('error', (error) => {
      console.error('Mail transporter error:', error);
    });
  }

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    // Add connection timeout and retry settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    // Add TLS settings for better connection handling
    secure: true,
    tls: {
      rejectUnauthorized: false
    }
  });

  /**
   * Verifies the email transporter connection
   */
  private async verifyTransporter(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Mail transporter verification failed:', error);
      return false;
    }
  }

  /**
   * Fetches address from LocationIQ reverse geocoding API.
   */
  async getAddressFromLatLng(latitude: number, longitude: number): Promise<string | null> {
    const apiKey = process.env.LOCATIONIQ_API_KEY;
    if (!apiKey) return null;
    const url = `https://us1.locationiq.com/v1/reverse?key=${apiKey}&lat=${latitude}&lon=${longitude}&format=json`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return data.display_name || null;
    } catch {
      return null;
    }
  }

  /**
   * Returns a static map image URL from LocationIQ for the given coordinates.
   */
  getMapImageUrl(latitude: number, longitude: number): string | null {
    const apiKey = process.env.LOCATIONIQ_API_KEY;
    if (!apiKey) return null;
    return `https://maps.locationiq.com/v3/staticmap?key=${apiKey}&center=${latitude},${longitude}&zoom=15&size=600x300&markers=icon:large-red-cutout|${latitude},${longitude}`;
  }

  /**
   * Gets site settings for email templates
   */
  private async getSiteSettingsForEmail() {
    try {
      return await this.siteSettingsService.getEmailSettings();
    } catch (error) {
      // Fallback to default values if site settings are not available
      return {
        siteName: 'Your Company',
        siteUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        businessEmail: process.env.GMAIL_USER || 'info@yourcompany.com',
        contactNumber: '+1234567890',
        businessAddress: 'Your Business Address'
      };
    }
  }

  /**
   * Replaces site settings placeholders in email templates
   */
  private replaceSiteSettingsPlaceholders(html: string, siteSettings: any): string {
    return html
      .replace(/{{siteName}}/g, siteSettings.siteName || 'Your Company')
      .replace(/{{siteUrl}}/g, siteSettings.siteUrl || 'http://localhost:3000')
      .replace(/{{businessEmail}}/g, siteSettings.businessEmail || 'info@yourcompany.com')
      .replace(/{{contactNumber}}/g, siteSettings.contactNumber || '+1234567890')
      .replace(/{{businessAddress}}/g, siteSettings.businessAddress || 'Your Business Address');
  }

  /**
   * Sends a login notification email to the admin using a template.
   * @param to - Recipient email address
   * @param deviceData - Object with device details
   * @param location - Object with latitude and longitude
   * @param ipAddress - IP address string
   */
  async sendLoginNotification(to: string, deviceData: Record<string, any>, location?: { latitude: number; longitude: number }, ipAddress?: string) {
    const subject = 'Admin Login Notification';
    // Use process.cwd() to resolve the template path from the project root
    const templatePath = join(process.cwd(), 'src', 'mail', 'templates', 'login-notification.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Get site settings
    const siteSettings = await this.getSiteSettingsForEmail();
    
    // Prepare values
    const device = deviceData ? JSON.stringify(deviceData) : 'Unknown';
    let locationStr = 'Unknown';
    let mapImg = '';
    if (location && location.latitude && location.longitude) {
      const address = await this.getAddressFromLatLng(location.latitude, location.longitude);
      locationStr = address ? `${address} (Lat: ${location.latitude}, Lng: ${location.longitude})` : `Lat: ${location.latitude}, Lng: ${location.longitude}`;
      const mapUrl = this.getMapImageUrl(location.latitude, location.longitude);
      if (mapUrl) {
        mapImg = `<div style="margin:18px 0;text-align:center;"><img src='${mapUrl}' alt='Map' style='max-width:100%;border-radius:8px;border:1.5px solid #e3f2fd;box-shadow:0 2px 8px rgba(25,118,210,0.08);'></div>`;
      }
    }
    const ip = ipAddress || 'Unknown';
    
    // Replace placeholders
    html = html.replace('{{device}}', device)
               .replace('{{location}}', locationStr)
               .replace('{{ipAddress}}', ip)
               .replace('{{mapImage}}', mapImg);
    
    // Replace site settings placeholders
    html = this.replaceSiteSettingsPlaceholders(html, siteSettings);
    
    await this.transporter.sendMail({
      from: siteSettings.businessEmail || process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
  }

  /**
   * Sends OTP email for password change verification.
   * @param to - Recipient email address
   * @param otp - 6-digit OTP code
   * @param actionType - Type of action (e.g., "Password Change", "2FA Setup", "Login Verification")
   */
  async sendOTPEmail(to: string, otp: string, actionType: string = 'Password Change') {
    const subject = `${actionType} Verification`;
    
    // Get site settings
    const siteSettings = await this.getSiteSettingsForEmail();
    
    // Use dedicated 2FA login template for login verification
    const templateName = actionType === 'Login Verification' ? '2fa-login-otp.html' : 'otp-email.html';
    const templatePath = join(process.cwd(), 'src', 'mail', 'templates', templateName);
    let html = readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    html = html.replace(/{{otp}}/g, otp);
    html = html.replace(/{{actionType}}/g, actionType);
    
    // Replace site settings placeholders
    html = this.replaceSiteSettingsPlaceholders(html, siteSettings);

    try {
      await this.transporter.sendMail({
        from: siteSettings.businessEmail || process.env.GMAIL_USER,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // Don't throw the error to prevent application crashes
    }
  }

  /**
   * Sends password reset email with token and OTP.
   * @param to - Recipient email address
   * @param token - Reset token
   * @param otp - 6-digit OTP code
   */
  async sendPasswordResetEmail(to: string, token: string, otp: string) {
    const subject = 'Password Reset Request';
    
    // Get site settings
    const siteSettings = await this.getSiteSettingsForEmail();
    
    // Read the template file
    const templatePath = join(process.cwd(), 'src', 'mail', 'templates', 'password-reset.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    html = html.replace(/{{token}}/g, token);
    html = html.replace(/{{otp}}/g, otp);
    
    // Replace site settings placeholders
    html = this.replaceSiteSettingsPlaceholders(html, siteSettings);

    try {
      await this.transporter.sendMail({
        from: siteSettings.businessEmail || process.env.GMAIL_USER,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw the error to prevent application crashes
    }
  }

  /**
   * Sends password change confirmation email.
   * @param to - Recipient email address
   * @param changedAt - When the password was changed
   * @param ipAddress - IP address where change was made
   * @param userAgent - User agent/browser info
   * @param sessionsDestroyed - Number of sessions destroyed
   */
  async sendPasswordChangeConfirmation(to: string, changedAt: Date, ipAddress?: string, userAgent?: string, sessionsDestroyed?: number) {
    const subject = 'Password Changed Successfully';
    
    // Get site settings
    const siteSettings = await this.getSiteSettingsForEmail();
    
    const formattedDate = changedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = changedAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // Read the template file
    const templatePath = join(process.cwd(), 'src', 'mail', 'templates', 'password-change-confirmation.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    html = html.replace(/{{changeDate}}/g, formattedDate);
    html = html.replace(/{{changeTime}}/g, formattedTime);
    html = html.replace(/{{ipAddress}}/g, ipAddress || 'Not available');
    html = html.replace(/{{userAgent}}/g, userAgent || 'Not available');
    html = html.replace(/{{sessionsDestroyed}}/g, sessionsDestroyed?.toString() || '0');
    
    // Replace site settings placeholders
    html = this.replaceSiteSettingsPlaceholders(html, siteSettings);

    await this.transporter.sendMail({
      from: siteSettings.businessEmail || process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
  }

  /**
   * Sends 2FA setup email.
   * @param to - Recipient email address
   * @param otp - 6-digit OTP code
   * @param actionType - Type of action (e.g., "2FA Setup", "2FA Disable")
   */
  async send2FASetupEmail(to: string, otp: string, actionType: string = '2FA Setup') {
    const subject = 'Two-Factor Authentication Setup';
    
    // Get site settings
    const siteSettings = await this.getSiteSettingsForEmail();
    
    // Read the template file
    const templatePath = join(process.cwd(), 'src', 'mail', 'templates', '2fa-setup.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Replace placeholders
    html = html.replace(/{{otp}}/g, otp);
    html = html.replace(/{{actionType}}/g, actionType);
    
    // Replace site settings placeholders
    html = this.replaceSiteSettingsPlaceholders(html, siteSettings);

    await this.transporter.sendMail({
      from: siteSettings.businessEmail || process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
  }

  /**
   * Sends 2FA status change confirmation email.
   * @param to - Recipient email address
   * @param enabled - Whether 2FA was enabled or disabled
   * @param changedAt - When the change was made
   * @param ipAddress - IP address where change was made
   * @param userAgent - User agent/browser info
   */
  async send2FAStatusChangeEmail(to: string, enabled: boolean, changedAt: Date, ipAddress?: string, userAgent?: string) {
    const subject = enabled ? 'Two-Factor Authentication Enabled' : 'Two-Factor Authentication Disabled';
    
    // Get site settings
    const siteSettings = await this.getSiteSettingsForEmail();
    
    const formattedDate = changedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = changedAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // Read the template file
    const templatePath = join(process.cwd(), 'src', 'mail', 'templates', '2fa-status-change.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Create status container based on enabled status
    const statusContainer = enabled 
      ? `<div class="status-container status-enabled">
           <div class="status-icon icon-enabled">🔐</div>
           <h2 style="margin-bottom: 8px; color: #4caf50;">Two-Factor Authentication Enabled</h2>
           <p style="margin-bottom: 18px; color: #444;">Your account is now protected with two-factor authentication.</p>
         </div>`
      : `<div class="status-container status-disabled">
           <div class="status-icon icon-disabled">🔓</div>
           <h2 style="margin-bottom: 8px; color: #ff9800;">Two-Factor Authentication Disabled</h2>
           <p style="margin-bottom: 18px; color: #444;">Two-factor authentication has been disabled for your account.</p>
         </div>`;

    // Create IP address item if available
    const ipAddressItem = ipAddress && ipAddress !== 'Not available'
      ? `<div class="info-item">
           <div class="info-label">IP Address</div>
           <div class="info-value">${ipAddress}</div>
         </div>`
      : '';

    // Create user agent item if available
    const userAgentItem = userAgent && userAgent !== 'Not available'
      ? `<div class="info-item">
           <div class="info-label">Device</div>
           <div class="info-value">${userAgent}</div>
         </div>`
      : '';

    // Create impact container based on enabled status
    const impactContainer = enabled
      ? `<div class="impact-container">
           <div class="impact-title">🔒 What This Means:</div>
           <ul class="impact-list">
             <li>You'll need to enter an OTP code for every login</li>
             <li>Enhanced security for your admin account</li>
             <li>Protection against unauthorized access</li>
             <li>Login notifications will be sent to your email</li>
           </ul>
         </div>`
      : `<div class="impact-container">
           <div class="impact-title">⚠️ What This Means:</div>
           <ul class="impact-list">
             <li>You can now login with just email and password</li>
             <li>Reduced security for your admin account</li>
             <li>Consider re-enabling 2FA for better protection</li>
             <li>Login notifications will still be sent to your email</li>
           </ul>
         </div>`;

    // Create re-enable button only if 2FA is disabled
    const reEnableButton = enabled ? '' : '<a href="#" class="action-button">Re-enable 2FA</a>';
    
    // Replace placeholders
    html = html.replace(/{{statusContainer}}/g, statusContainer);
    html = html.replace(/{{changeDate}}/g, formattedDate);
    html = html.replace(/{{changeTime}}/g, formattedTime);
    html = html.replace(/{{ipAddressItem}}/g, ipAddressItem);
    html = html.replace(/{{userAgentItem}}/g, userAgentItem);
    html = html.replace(/{{impactContainer}}/g, impactContainer);
    html = html.replace(/{{reEnableButton}}/g, reEnableButton);
    
    // Replace site settings placeholders
    html = this.replaceSiteSettingsPlaceholders(html, siteSettings);

    await this.transporter.sendMail({
      from: siteSettings.businessEmail || process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
  }

  /**
   * Sends enquiry notification email to all admins and super admins.
   * @param enquiryData - The enquiry data to include in the notification
   * @param adminEmails - Array of admin email addresses to notify
   */
  async sendEnquiryNotificationToAdmins(enquiryData: {
    fullName: string;
    email: string;
    phone?: string;
    subject: string;
    inquiryCategory: string;
    message: string;
    isStarred: boolean;
    ipAddress?: string;
    createdAt: Date;
  }, adminEmails: string[]) {
    const subject = `New Enquiry: ${enquiryData.subject}`;
    
    // Get site settings
    const siteSettings = await this.getSiteSettingsForEmail();
    
    // Read the template file
    const templatePath = join(process.cwd(), 'src', 'mail', 'templates', 'enquiry-notification.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Format the submission date
    const submittedAt = enquiryData.createdAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Create admin panel URL (you can customize this based on your frontend URL)
    const adminPanelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/enquiries`;
    const replyUrl = `mailto:${enquiryData.email}?subject=Re: ${enquiryData.subject}`;

    // Create phone row if available
    const phoneRow = enquiryData.phone
      ? `<div class="detail-row">
           <div class="detail-label">Phone:</div>
           <div class="detail-value">${enquiryData.phone}</div>
         </div>`
      : '';

    // Create IP address row if available
    const ipAddressRow = enquiryData.ipAddress
      ? `<div class="detail-row">
           <div class="detail-label">IP Address:</div>
           <div class="detail-value">${enquiryData.ipAddress}</div>
         </div>`
      : '';

    // Create starred indicator if applicable
    const starredIndicator = enquiryData.isStarred
      ? '<span class="priority-indicator">⭐ Starred</span>'
      : '';
    
    // Replace placeholders
    html = html.replace(/{{fullName}}/g, enquiryData.fullName);
    html = html.replace(/{{email}}/g, enquiryData.email);
    html = html.replace(/{{subject}}/g, enquiryData.subject);
    html = html.replace(/{{inquiryCategory}}/g, enquiryData.inquiryCategory);
    html = html.replace(/{{message}}/g, enquiryData.message);
    html = html.replace(/{{submittedAt}}/g, submittedAt);
    html = html.replace(/{{adminPanelUrl}}/g, adminPanelUrl);
    html = html.replace(/{{replyUrl}}/g, replyUrl);
    html = html.replace(/{{phoneRow}}/g, phoneRow);
    html = html.replace(/{{ipAddressRow}}/g, ipAddressRow);
    html = html.replace(/{{starredIndicator}}/g, starredIndicator);
    
    // Replace site settings placeholders
    html = this.replaceSiteSettingsPlaceholders(html, siteSettings);

    // Send email to all admins with proper error handling
    try {
      await this.transporter.sendMail({
        from: siteSettings.businessEmail || process.env.GMAIL_USER,
        to: adminEmails.join(', '),
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send enquiry notification email:', error);
      // Don't throw the error to prevent application crashes
    }
  }

  /**
   * Sends admin reply email to enquiry submitter.
   * @param enquiryData - The original enquiry data
   * @param adminReply - The admin's reply message
   * @param adminName - The name of the admin who replied
   */
  async sendAdminReplyToEnquirer(enquiryData: {
    fullName: string;
    email: string;
    subject: string;
    message: string;
  }, adminReply: string, adminName: string) {
    const subject = `Re: ${enquiryData.subject}`;
    
    // Get site settings
    const siteSettings = await this.getSiteSettingsForEmail();
    
    // Read the template file
    const templatePath = join(process.cwd(), 'src', 'mail', 'templates', 'enquiry-reply.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Format the reply date
    const replyDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // Replace placeholders
    html = html.replace(/{{originalSubject}}/g, enquiryData.subject);
    html = html.replace(/{{originalMessage}}/g, enquiryData.message);
    html = html.replace(/{{adminReply}}/g, adminReply);
    html = html.replace(/{{adminName}}/g, adminName);
    html = html.replace(/{{replyDate}}/g, replyDate);
    
    // Replace site settings placeholders
    html = this.replaceSiteSettingsPlaceholders(html, siteSettings);

    // Send email to the enquirer with proper error handling
    try {
      await this.transporter.sendMail({
        from: siteSettings.businessEmail || process.env.GMAIL_USER,
        to: enquiryData.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send admin reply email:', error);
      // Don't throw the error to prevent application crashes
    }
  }

  /**
   * Sends admin welcome email with credentials
   */
  async sendAdminWelcomeEmail(adminData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
  }) {
    const subject = 'Welcome to Admin Panel - Your Account Details';
    const templatePath = join(process.cwd(), 'src', 'mail', 'templates', 'admin-welcome.html');
    let html = readFileSync(templatePath, 'utf8');
    
    // Get site settings
    const siteSettings = await this.getSiteSettingsForEmail();
    
    // Replace placeholders
    html = html
      .replace(/{{firstName}}/g, adminData.firstName)
      .replace(/{{lastName}}/g, adminData.lastName)
      .replace(/{{email}}/g, adminData.email)
      .replace(/{{username}}/g, adminData.username)
      .replace(/{{password}}/g, adminData.password)
      .replace(/{{role}}/g, adminData.role);
    
    // Replace site settings placeholders
    html = this.replaceSiteSettingsPlaceholders(html, siteSettings);
    
    // Send email with proper error handling
    const mailOptions = {
      from: siteSettings.businessEmail || process.env.GMAIL_USER,
      to: adminData.email,
      subject: subject,
      html: html
    };
    
    try {
      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send admin welcome email:', error);
      // Don't throw the error to prevent application crashes
      return null;
    }
  }
} 