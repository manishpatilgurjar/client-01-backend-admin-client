import { Schema, model, Document } from 'mongoose';

export interface AboutUs extends Document {
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const AboutUsSchema = new Schema<AboutUs>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AboutUsSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const AboutUsModel = model<AboutUs>('AboutUs', AboutUsSchema, 'about_us'); 