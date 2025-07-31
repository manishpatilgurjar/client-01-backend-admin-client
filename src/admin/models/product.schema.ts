import { Schema, model, Document } from 'mongoose';

export interface Product extends Document {
  name: string;
  category: string;
  status: 'Draft' | 'Published' | 'Archived';
  shortDescription: string;
  fullDescription: string;
  features: string[];
  images: string[];
  isPublished: boolean;
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<Product>({
  name: { type: String, required: true },
  category: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Published', 'Archived'], 
    default: 'Draft' 
  },
  shortDescription: { type: String, required: true },
  fullDescription: { type: String, required: true },
  features: [{ type: String }],
  images: [{ type: String }],
  isPublished: { type: Boolean, default: false },
  lastModified: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProductSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  this.lastModified = new Date();
  next();
});

export const ProductModel = model<Product>('Product', ProductSchema, 'products'); 