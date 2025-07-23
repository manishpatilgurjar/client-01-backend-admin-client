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
} 