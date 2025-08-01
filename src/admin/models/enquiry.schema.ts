import { Schema, model, Document } from 'mongoose';

export interface EnquiryReply {
  adminName: string;
  adminEmail: string;
  replyMessage: string;
  repliedAt: Date;
}

export interface Enquiry extends Document {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  inquiryCategory: string;
  message: string;
  status: 'new' | 'in-progress' | 'replied' | 'closed';
  isStarred: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  repliedAt?: Date;
  adminNotes?: string;
  replies?: EnquiryReply[];
}

const EnquiryReplySchema = new Schema<EnquiryReply>({
  adminName: { 
    type: String, 
    required: true 
  },
  adminEmail: { 
    type: String, 
    required: true 
  },
  replyMessage: { 
    type: String, 
    required: true 
  },
  repliedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const EnquirySchema = new Schema<Enquiry>({
  fullName: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  phone: { 
    type: String, 
    trim: true
  },
  subject: { 
    type: String, 
    required: true,
    trim: true
  },
  inquiryCategory: { 
    type: String, 
    required: true,
    enum: ['General Inquiry', 'Product Inquiry', 'Technical Support', 'Sales Inquiry', 'Partnership', 'Other'],
    default: 'General Inquiry'
  },
  message: { 
    type: String, 
    required: true,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['new', 'in-progress', 'replied', 'closed'],
    default: 'new',
    index: true
  },
  isStarred: { 
    type: Boolean, 
    default: false,
    index: true
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  },
  adminNotes: { 
    type: String,
    trim: true
  },
  repliedAt: { 
    type: Date 
  },
  replies: [EnquiryReplySchema],
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create indexes for efficient querying
EnquirySchema.index({ email: 1, createdAt: -1 });
EnquirySchema.index({ status: 1, createdAt: -1 });
EnquirySchema.index({ isStarred: 1, createdAt: -1 });
EnquirySchema.index({ inquiryCategory: 1, createdAt: -1 });
EnquirySchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
EnquirySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const EnquiryModel = model<Enquiry>('Enquiry', EnquirySchema, 'enquiries'); 