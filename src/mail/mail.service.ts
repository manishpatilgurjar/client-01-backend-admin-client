import { Injectable } from '@nestjs/common';
const nodemailer = require('nodemailer');
import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

/**
 * Service for sending emails using Google SMTP.
 * Reads credentials from environment variables:
 * - GMAIL_USER: Gmail address
 * - GMAIL_PASS: Gmail app password
 * - LOCATIONIQ_API_KEY: LocationIQ API key
 */
@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

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
    await this.transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
  }

  /**
   * Sends OTP email for password change verification.
   * @param to - Recipient email address
   * @param otp - 6-digit OTP code
   */
  async sendOTPEmail(to: string, otp: string) {
    const subject = 'Password Change OTP Verification';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔐 Password Change Verification</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            You have requested to change your password. To complete this process, please use the following OTP (One-Time Password):
          </p>
          
          <div style="background-color: #f0f8ff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0; font-weight: bold;">${otp}</h1>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <strong>Important:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <li>This OTP is valid for 10 minutes only</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you didn't request this password change, please ignore this email</li>
          </ul>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; font-size: 14px; margin: 0;">
              <strong>Security Notice:</strong> For your security, this OTP will expire automatically after 10 minutes.
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated message from MedoScopic Pharma Admin System.
          </p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
  }

  /**
   * Sends password reset email with token and OTP.
   * @param to - Recipient email address
   * @param token - Reset token
   * @param otp - 6-digit OTP code
   */
  async sendPasswordResetEmail(to: string, token: string, otp: string) {
    const subject = 'Password Reset Request';
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center; margin-bottom: 30px;">🔄 Password Reset Request</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            You have requested to reset your password. To complete this process, please use the following information:
          </p>
          
          <div style="background-color: #f0f8ff; border: 2px solid #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #007bff; margin-bottom: 10px;">Reset Token:</h3>
            <p style="color: #333; font-family: monospace; font-size: 14px; word-break: break-all; margin: 0;">${token}</p>
          </div>
          
          <div style="background-color: #f0f8ff; border: 2px solid #28a745; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #28a745; margin-bottom: 10px;">OTP Code:</h3>
            <h1 style="color: #28a745; font-size: 32px; letter-spacing: 5px; margin: 0; font-weight: bold;">${otp}</h1>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <strong>Important:</strong>
          </p>
          <ul style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            <li>This reset link and OTP are valid for 24 hours</li>
            <li>Do not share this information with anyone</li>
            <li>If you didn't request this password reset, please ignore this email</li>
          </ul>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; font-size: 14px; margin: 0;">
              <strong>Security Notice:</strong> For your security, this reset link will expire automatically after 24 hours.
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated message from MedoScopic Pharma Admin System.
          </p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
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
    const formattedDate = changedAt.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #28a745; text-align: center; margin-bottom: 30px;">✅ Password Changed Successfully</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Your password has been successfully changed. Here are the details of this change:
          </p>
          
          <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">📅 Change Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold; width: 120px;">Changed At:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">IP Address:</td>
                <td style="padding: 8px 0; color: #333;">${ipAddress || 'Unknown'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Device/Browser:</td>
                <td style="padding: 8px 0; color: #333;">${userAgent || 'Unknown'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #155724; font-size: 14px; margin: 0;">
              <strong>✅ Success:</strong> Your password has been updated successfully. You can now use your new password to log in.
            </p>
          </div>
          
          <div style="background-color: #e2e3e5; border: 1px solid #d6d8db; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #383d41; font-size: 14px; margin: 0;">
              <strong>🔒 Security Action:</strong> For your security, you have been automatically logged out from all other devices and sessions. You will need to log in again with your new password.
            </p>
            ${sessionsDestroyed ? `<p style="color: #383d41; font-size: 12px; margin: 5px 0 0 0;">Sessions terminated: ${sessionsDestroyed}</p>` : ''}
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; font-size: 14px; margin: 0;">
              <strong>🔒 Security Notice:</strong> If you did not make this change, please contact your system administrator immediately and consider changing your password again.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Login to Admin Panel
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated security notification from MedoScopic Pharma Admin System.
          </p>
        </div>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
  }
} 