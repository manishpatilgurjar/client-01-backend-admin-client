import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);

  constructor() {
    // Initialize SendGrid service - API key will be set when needed
    this.logger.log('SendGrid service initialized');
  }

  /**
   * Initialize SendGrid with API key
   */
  private initializeSendGrid(): void {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY not found in environment variables. SendGrid features will be disabled.');
      this.logger.warn('To enable SendGrid, add SENDGRID_API_KEY to your environment variables.');
      return;
    }
    
    sgMail.setApiKey(apiKey);
    this.logger.log('SendGrid API key set successfully');
  }

  /**
   * Check if SendGrid is properly configured
   */
  private isSendGridConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }

  /**
   * Send campaign email via SendGrid with tracking
   */
  async sendCampaignEmail(data: {
    to: string;
    subject: string;
    content: string;
    campaignId: string;
    trackingId: string;
    fromEmail?: string;
    fromName?: string;
  }): Promise<any> {
    console.log(`📧 [SENDGRID] Sending campaign email to: ${data.to}`);
    console.log(`📧 [SENDGRID] Campaign ID: ${data.campaignId}`);
    console.log(`📧 [SENDGRID] Tracking ID: ${data.trackingId}`);

    // Initialize SendGrid if not already done
    this.initializeSendGrid();

    // Check if SendGrid is configured
    if (!this.isSendGridConfigured()) {
      throw new Error('SendGrid is not configured. Please add SENDGRID_API_KEY to your environment variables.');
    }

    const fromEmail = data.fromEmail || process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER;
    const fromName = data.fromName || process.env.SENDGRID_FROM_NAME || 'Your Company';

    if (!fromEmail) {
      throw new Error('SENDGRID_FROM_EMAIL or GMAIL_USER environment variable is required');
    }

    console.log(`📧 [SENDGRID] From Email: ${fromEmail}`);
    console.log(`📧 [SENDGRID] From Name: ${fromName}`);
    console.log(`📧 [SENDGRID] To Email: ${data.to}`);
    console.log(`📧 [SENDGRID] Subject: ${data.subject}`);

    // Create email HTML with tracking
    const emailHtml = this.createEmailHtml(data.content, data.trackingId);

    const msg = {
      to: data.to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: data.subject,
      html: emailHtml,
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: true
        },
        openTracking: {
          enable: true
        },
        subscriptionTracking: {
          enable: true,
          text: 'Unsubscribe from this list',
          html: '<p>Unsubscribe from this list</p>',
          substitutionTag: '[Unsubscribe]'
        }
      },
      customArgs: {
        campaignId: data.campaignId,
        trackingId: data.trackingId,
        emailType: 'campaign'
      },
      // Add tracking ID to message headers for webhook events
      headers: {
        'X-Tracking-ID': data.trackingId,
        'X-Campaign-ID': data.campaignId
      }
    };

    try {
      console.log(`📧 [SENDGRID] Sending email via SendGrid...`);
      const response = await sgMail.send(msg);
      
      console.log(`✅ [SENDGRID] Email sent successfully to ${data.to}`);
      console.log(`📧 [SENDGRID] SendGrid response:`, {
        statusCode: response[0].statusCode,
        headers: response[0].headers,
        messageId: response[0].headers['x-message-id']
      });

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        statusCode: response[0].statusCode,
        to: data.to,
        trackingId: data.trackingId
      };

    } catch (error) {
      console.error(`❌ [SENDGRID] Failed to send email to ${data.to}:`, error);
      console.error(`❌ [SENDGRID] Error details:`, {
        message: error.message,
        code: error.code,
        response: error.response?.body,
        statusCode: error.code
      });

      // Create error object for tracking
      const trackingError: any = new Error(`SendGrid error: ${error.message}`);
      trackingError.code = error.code || '500';
      trackingError.response = error.response?.body || error.message;
      trackingError.sendgridError = true;

      throw trackingError;
    }
  }

  /**
   * Create email HTML with tracking pixels and links
   */
  private createEmailHtml(content: string, trackingId: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Campaign Email</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: #f8f9fa; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: #fff; 
            padding: 20px; 
            border: 1px solid #e9ecef; 
          }
          .footer { 
            background: #f8f9fa; 
            padding: 15px; 
            text-align: center; 
            border-radius: 0 0 8px 8px; 
            font-size: 12px; 
            color: #6c757d; 
          }
          .unsubscribe { 
            color: #6c757d; 
            text-decoration: none; 
          }
          .tracking-pixel {
            width: 1px;
            height: 1px;
            opacity: 0;
            position: absolute;
            top: -1px;
            left: -1px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Campaign Email</h2>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>This email was sent as part of a campaign</p>
            <p><a href="#" class="unsubscribe">Unsubscribe</a></p>
          </div>
        </div>
        
        <!-- Tracking pixel for open tracking -->
        <img src="http://43.204.103.195:3000/api/tracking/pixel/${trackingId}" 
             class="tracking-pixel" 
             alt="" />
      </body>
      </html>
    `;
  }

  /**
   * Verify email address using SendGrid
   */
  async verifyEmail(email: string): Promise<boolean> {
    try {
      // SendGrid doesn't have a direct email validation API in the free tier
      // We'll use a simple format check for now
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    } catch (error) {
      console.error(`❌ [SENDGRID] Email verification failed for ${email}:`, error);
      return false;
    }
  }

  /**
   * Get SendGrid account statistics
   */
  async getAccountStats(): Promise<any> {
    try {
      // Note: This would require SendGrid's Statistics API which might not be available in free tier
      // For now, return basic info
      return {
        provider: 'SendGrid',
        status: 'active',
        message: 'Statistics available via SendGrid dashboard'
      };
    } catch (error) {
      console.error(`❌ [SENDGRID] Failed to get account stats:`, error);
      return {
        provider: 'SendGrid',
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Test SendGrid connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Initialize SendGrid if not already done
      this.initializeSendGrid();

      // Check if SendGrid is configured
      if (!this.isSendGridConfigured()) {
        this.logger.error('SendGrid is not configured');
        return false;
      }

      const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER;
      if (!fromEmail) {
        this.logger.error('No from email configured for SendGrid test');
        return false;
      }

      // Try to send a test email to verify connection
      const testMsg = {
        to: 'test@example.com',
        from: fromEmail,
        subject: 'SendGrid Connection Test',
        text: 'This is a test email to verify SendGrid connection.',
        html: '<p>This is a test email to verify SendGrid connection.</p>'
      };

      await sgMail.send(testMsg);
      this.logger.log('SendGrid connection test successful');
      return true;
    } catch (error) {
      this.logger.error('SendGrid connection test failed:', error);
      return false;
    }
  }
} 