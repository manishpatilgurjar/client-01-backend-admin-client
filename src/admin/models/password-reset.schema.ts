import { Schema, model, Document } from 'mongoose';

export interface PasswordReset extends Document {
  email: string;
  token: string;
  otp: string;
  otpExpiresAt: Date;
  tokenExpiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<PasswordReset>({
  email: { 
    type: String, 
    required: true,
    index: true 
  },
  token: { 
    type: String, 
    required: true,
    unique: true 
  },
  otp: { 
    type: String, 
    required: true 
  },
  otpExpiresAt: { 
    type: Date, 
    required: true,
    index: true 
  },
  tokenExpiresAt: { 
    type: Date, 
    required: true,
    index: true 
  },
  isUsed: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  }
});

// Create indexes for efficient querying
PasswordResetSchema.index({ email: 1, createdAt: -1 });
PasswordResetSchema.index({ token: 1, isUsed: 1 });
PasswordResetSchema.index({ otpExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetModel = model<PasswordReset>('PasswordReset', PasswordResetSchema, 'password_resets'); 