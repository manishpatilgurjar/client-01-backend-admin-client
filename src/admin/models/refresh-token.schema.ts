import { Schema, model, Document, Types } from 'mongoose';

/**
 * Mongoose document interface for refresh tokens.
 */
export interface RefreshToken extends Document {
  userId: Types.ObjectId;
  token: string;
  deviceData?: Record<string, any>;
  ipAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Mongoose schema for refresh tokens.
 * Stores the refresh token string, associated user, device info, and expiry.
 */
const RefreshTokenSchema = new Schema<RefreshToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
  token: { type: String, required: true, unique: true },
  deviceData: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

/**
 * Mongoose model for refresh tokens, using the 'refresh_token' collection.
 */
export const RefreshTokenModel = model<RefreshToken>('RefreshToken', RefreshTokenSchema, 'refresh_token'); 