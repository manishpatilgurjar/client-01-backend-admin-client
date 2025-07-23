import { Schema, model, Document } from 'mongoose';

export interface TeamMember {
  name: string;
  role: string;
  photo?: string;
  bio?: string;
  email?: string;
  linkedin?: string;
}

export interface AboutUs extends Document {
  title: string;
  description: string;
  images: string[];
  team: TeamMember[];
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    [key: string]: string | undefined;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<TeamMember>({
  name: { type: String, required: true },
  role: { type: String, required: true },
  photo: { type: String },
  bio: { type: String },
  email: { type: String },
  linkedin: { type: String },
});

const AboutUsSchema = new Schema<AboutUs>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  team: [TeamMemberSchema],
  contactEmail: { type: String },
  contactPhone: { type: String },
  address: { type: String },
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    linkedin: { type: String },
    instagram: { type: String },
    youtube: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AboutUsSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const AboutUsModel = model<AboutUs>('AboutUs', AboutUsSchema, 'about_us'); 