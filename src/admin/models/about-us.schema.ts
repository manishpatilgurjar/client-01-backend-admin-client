import { Schema, model, Document } from 'mongoose';

export interface TeamMember {
  _id?: string;
  name: string;
  position: string;
  image?: string;
  bio?: string;
  email?: string;
  linkedin?: string;
  twitter?: string;
  order: number;
}

export interface AboutSection {
  _id?: string;
  title: string;
  content: string;
  image?: string;
  order: number;
}

export interface AboutUs extends Document {
  mainTitle: string;
  mainDescription: string;
  mainImage?: string;
  sections: AboutSection[];
  teamMembers: TeamMember[];
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<TeamMember>({
  name: { type: String, required: true },
  position: { type: String, required: true },
  image: { type: String },
  bio: { type: String },
  email: { type: String },
  linkedin: { type: String },
  twitter: { type: String },
  order: { type: Number, default: 0 },
});

const AboutSectionSchema = new Schema<AboutSection>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  order: { type: Number, default: 0 },
});

const AboutUsSchema = new Schema<AboutUs>({
  mainTitle: { type: String, required: true },
  mainDescription: { type: String, required: true },
  mainImage: { type: String },
  sections: [AboutSectionSchema],
  teamMembers: [TeamMemberSchema],
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