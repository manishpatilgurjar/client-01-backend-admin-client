import { Schema, model, Document } from 'mongoose';

export interface PasswordHistory extends Document {
  userId: string;
  changedAt: Date;
  changedBy: string;
  ipAddress?: string;
  userAgent?: string;
  reason: 'change' | 'reset' | 'admin';
}

const PasswordHistorySchema = new Schema<PasswordHistory>({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  changedAt: { 
    type: Date, 
    required: true,
    default: Date.now,
    index: true 
  },
  changedBy: { 
    type: String, 
    required: true 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  },
  reason: { 
    type: String, 
    required: true,
    enum: ['change', 'reset', 'admin'],
    default: 'change'
  }
}, { timestamps: true });

// Create indexes for efficient querying
PasswordHistorySchema.index({ userId: 1, changedAt: -1 });
PasswordHistorySchema.index({ changedAt: -1 });

export const PasswordHistoryModel = model<PasswordHistory>('PasswordHistory', PasswordHistorySchema, 'password_history'); 