import { Controller, Post, Get, Param, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { EmailTrackingService } from '../services/email-tracking.service';
import { EmailBounceService } from '../services/email-bounce.service';
import { BounceType } from '../models/email-bounce.schema';

@Controller('api/webhooks')
export class WebhookController {
  constructor(
    private readonly emailTrackingService: EmailTrackingService,
    private readonly emailBounceService: EmailBounceService
  ) {}

  /**
   * Handle SendGrid webhook events
   */
  @Post('sendgrid')
  async handleSendGridWebhook(@Body() events: any[], @Res() res: Response) {
    console.log(`🔥 [WEBHOOK] WEBHOOK RECEIVED! Events count: ${events.length}`);
    console.log(`🔥 [WEBHOOK] Events data:`, JSON.stringify(events, null, 2));
    
    try {
      for (const event of events) {
        await this.processSendGridEvent(event);
      }
      
      console.log(`✅ [WEBHOOK] All events processed successfully`);
      res.status(HttpStatus.OK).json({ message: 'Events processed successfully' });
    } catch (error) {
      console.error(`❌ [WEBHOOK] Error processing SendGrid events:`, error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Failed to process events' });
    }
  }

  /**
   * Process individual SendGrid event
   */
  private async processSendGridEvent(event: any): Promise<void> {
    console.log(`🔥 [WEBHOOK] Processing event type: ${event.event} for email: ${event.email}`);

    // Try to get tracking ID from multiple sources
    let trackingId = event.custom_args?.trackingId;
    let campaignId = event.custom_args?.campaignId;

    // If not in custom_args, try headers
    if (!trackingId && event.headers) {
      trackingId = event.headers['X-Tracking-ID'] || event.headers['x-tracking-id'];
      campaignId = event.headers['X-Campaign-ID'] || event.headers['x-campaign-id'];
    }

    // If still not found, try to find by email
    if (!trackingId) {
      console.log(`🔍 [WEBHOOK] No tracking ID found, searching by email: ${event.email}`);
      try {
        const trackingRecord = await this.emailTrackingService.findByEmail(event.email);
        if (trackingRecord) {
          trackingId = (trackingRecord as any)._id.toString();
          console.log(`✅ [WEBHOOK] Found tracking record: ${trackingId}`);
        } else {
          console.log(`⚠️ [WEBHOOK] No tracking record found for: ${event.email}`);
          return;
        }
      } catch (error) {
        console.error(`❌ [WEBHOOK] Error finding tracking record:`, error);
        return;
      }
    }

    switch (event.event) {
      case 'delivered':
        await this.handleDeliveredEvent(trackingId, event);
        break;
      
      case 'bounce':
        await this.handleBounceEvent(trackingId, event);
        break;
      
      case 'open':
        await this.handleOpenEvent(trackingId, event);
        break;
      
      case 'click':
        await this.handleClickEvent(trackingId, event);
        break;
      
      case 'unsubscribe':
        await this.handleUnsubscribeEvent(trackingId, event);
        break;
      
      case 'spamreport':
        await this.handleSpamReportEvent(trackingId, event);
        break;
      
      case 'dropped':
        await this.handleDroppedEvent(trackingId, event);
        break;
      
      default:
        console.log(`🔥 [WEBHOOK] Unhandled event type: ${event.event}`);
        break;
    }
  }

  /**
   * Handle delivered event
   */
  private async handleDeliveredEvent(trackingId: string, event: any): Promise<void> {
    console.log(`🔥 [WEBHOOK] DELIVERED: ${event.email}`);
    
    try {
      await this.emailTrackingService.markAsSent(trackingId);
    } catch (error) {
      console.error(`❌ [WEBHOOK] Failed to update tracking for delivered email:`, error);
    }
  }

  /**
   * Handle bounce event
   */
  private async handleBounceEvent(trackingId: string, event: any): Promise<void> {
    console.log(`🔥 [WEBHOOK] BOUNCED: ${event.email}`);
    
    try {
      const bounceType = this.determineBounceType(event);
      
      await this.emailBounceService.processBounce({
        recipientEmail: event.email,
        bounceType: bounceType,
        reason: event.reason || 'Email bounced',
        smtpCode: event.sg_event_id,
        smtpMessage: event.reason,
        originalMessageId: event.sg_message_id
      });
    } catch (error) {
      console.error(`❌ [WEBHOOK] Failed to process bounce:`, error);
    }
  }

  /**
   * Handle open event
   */
  private async handleOpenEvent(trackingId: string, event: any): Promise<void> {
    console.log(`🔥 [WEBHOOK] OPENED: ${event.email}`);
    
    try {
      // Update tracking record with open information
      await this.emailTrackingService.markAsOpened(trackingId, {
        openedAt: new Date(event.timestamp * 1000),
        userAgent: event.useragent,
        ip: event.ip
      });
    } catch (error) {
      console.error(`❌ [WEBHOOK] Failed to track open:`, error);
    }
  }

  /**
   * Handle click event
   */
  private async handleClickEvent(trackingId: string, event: any): Promise<void> {
    console.log(`🔥 [WEBHOOK] CLICKED: ${event.email}`);
    
    try {
      // Update tracking record with click information
      await this.emailTrackingService.markAsClicked(trackingId, {
        clickedAt: new Date(event.timestamp * 1000),
        url: event.url,
        userAgent: event.useragent,
        ip: event.ip
      });
    } catch (error) {
      console.error(`❌ [WEBHOOK] Failed to track click:`, error);
    }
  }

  /**
   * Handle unsubscribe event
   */
  private async handleUnsubscribeEvent(trackingId: string, event: any): Promise<void> {
    console.log(`🔥 [WEBHOOK] UNSUBSCRIBED: ${event.email}`);
    
    try {
      await this.emailBounceService.processBounce({
        recipientEmail: event.email,
        bounceType: BounceType.UNSUBSCRIBED,
        reason: 'User unsubscribed from emails',
        originalMessageId: event.sg_message_id
      });
    } catch (error) {
      console.error(`❌ [WEBHOOK] Failed to process unsubscribe:`, error);
    }
  }

  /**
   * Handle spam report event
   */
  private async handleSpamReportEvent(trackingId: string, event: any): Promise<void> {
    console.log(`🔥 [WEBHOOK] SPAM REPORT: ${event.email}`);
    
    try {
      await this.emailBounceService.processBounce({
        recipientEmail: event.email,
        bounceType: BounceType.SPAM,
        reason: 'Email marked as spam',
        originalMessageId: event.sg_message_id
      });
    } catch (error) {
      console.error(`❌ [WEBHOOK] Failed to process spam report:`, error);
    }
  }

  /**
   * Handle dropped event
   */
  private async handleDroppedEvent(trackingId: string, event: any): Promise<void> {
    console.log(`🔥 [WEBHOOK] DROPPED: ${event.email}`);
    
    try {
      await this.emailBounceService.processBounce({
        recipientEmail: event.email,
        bounceType: BounceType.HARD_BOUNCE,
        reason: event.reason || 'Email dropped by SendGrid',
        originalMessageId: event.sg_message_id
      });
    } catch (error) {
      console.error(`❌ [WEBHOOK] Failed to process drop:`, error);
    }
  }

  /**
   * Determine bounce type from SendGrid event
   */
  private determineBounceType(event: any): BounceType {
    const reason = event.reason?.toLowerCase() || '';
    
    if (reason.includes('invalid') || reason.includes('not found') || reason.includes('does not exist')) {
      return BounceType.INVALID_EMAIL;
    }
    
    if (reason.includes('mailbox full') || reason.includes('quota exceeded')) {
      return BounceType.SOFT_BOUNCE;
    }
    
    if (reason.includes('blocked') || reason.includes('spam')) {
      return BounceType.BLOCKED;
    }
    
    // Default to hard bounce
    return BounceType.HARD_BOUNCE;
  }

  /**
   * Tracking pixel endpoint for open tracking
   */
  @Get('tracking/pixel/:trackingId')
  async trackingPixel(@Param('trackingId') trackingId: string, @Res() res: Response) {
    console.log(`🔥 [WEBHOOK] TRACKING PIXEL: ${trackingId}`);
    
    try {
      // Mark email as opened
      await this.emailTrackingService.markAsOpened(trackingId, {
        openedAt: new Date(),
        userAgent: 'Tracking Pixel',
        ip: 'Unknown'
      });
    } catch (error) {
      console.error(`❌ [WEBHOOK] Failed to track pixel open:`, error);
    }
    
    // Return a 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.send(pixel);
  }
} 