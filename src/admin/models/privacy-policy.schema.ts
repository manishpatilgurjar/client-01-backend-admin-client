import { Schema, model, Document } from 'mongoose';

export interface PrivacyPolicy extends Document {
  title: string;
  policyDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrivacyPolicySchema = new Schema<PrivacyPolicy>({
  title: { type: String, required: true },
  policyDescription: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PrivacyPolicySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const PrivacyPolicyModel = model<PrivacyPolicy>('PrivacyPolicy', PrivacyPolicySchema, 'privacy_policy'); 