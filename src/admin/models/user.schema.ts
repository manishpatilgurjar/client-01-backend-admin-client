import { Schema, model, Document } from 'mongoose';
// Use require for bcrypt to ensure compatibility with ts-node and CommonJS
const bcrypt = require('bcrypt');

export interface AdminUser extends Document {
  username: string;
  email: string;
  password: string;
  role: string;
  profilePic?: string;
  deviceData?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<AdminUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin', immutable: true },
  profilePic: { type: String },
  deviceData: { type: String },
  fullName: { type: String },
  phone: { type: String },
  address: { type: String },
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