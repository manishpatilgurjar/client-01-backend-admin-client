import { Schema, model, Document } from 'mongoose';

export interface FAQ extends Document {
  question: string;
  answer: string;
  status: 'Draft' | 'Published' | 'Archived';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<FAQ>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Archived'], 
    default: 'Draft' 
  },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

FAQSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const FAQModel = model<FAQ>('FAQ', FAQSchema, 'faqs'); 