import { Schema, model, Document } from 'mongoose';
// Use require for bcrypt to ensure compatibility with ts-node and CommonJS
const bcrypt = require('bcrypt');

export interface AdminUser extends Document {
  username: string;
  email: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
  profilePic?: string;
  deviceData?: string;
  phone?: string;
  location?: string;
  bio?: string;
  lastLogin?: Date;
  isActive: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  permissions: string[];
  preferences: {
    theme: string;
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<AdminUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin', immutable: true },
  firstName: { type: String },
  lastName: { type: String },
  profilePic: { type: String },
  deviceData: { type: String },
  phone: { type: String },
  location: { type: String },
  bio: { type: String },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
                permissions: { type: [String], default: ['read', 'write', 'delete', 'admin'] },
              twoFactorEnabled: { type: Boolean, default: false },
              twoFactorSecret: { type: String },
              preferences: {
                theme: { type: String, default: 'light' },
                language: { type: String, default: 'en' },
                notifications: {
                  email: { type: Boolean, default: true },
                  push: { type: Boolean, default: false }
                }
              },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

AdminUserSchema.pre('save', async function (next) {
  this.updatedAt = new Date();
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

export const AdminUserModel = model<AdminUser>('AdminUser', AdminUserSchema, 'admin_user'); 