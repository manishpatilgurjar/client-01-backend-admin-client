import { Schema, model, Document } from 'mongoose';

export interface ActivityLog extends Document {
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string; // Add user role to track who performed the action
  details?: string;
  timestamp: Date;
  type: 'create' | 'update' | 'delete' | 'status' | 'system' | 'edit';
}

const ActivityLogSchema = new Schema<ActivityLog>({
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String },
  entityName: { type: String },
  userId: { type: String },
  userEmail: { type: String },
  userRole: { type: String }, // Add user role field
  details: { type: String },
  timestamp: { type: Date, required: true, default: Date.now },
  type: { 
    type: String, 
    required: true, 
    enum: ['create', 'update', 'delete', 'status', 'system', 'edit'] 
  }
}, { timestamps: true });

// Create index for efficient querying
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ entity: 1, timestamp: -1 });
ActivityLogSchema.index({ type: 1, timestamp: -1 });

export const ActivityLogModel = model<ActivityLog>('ActivityLog', ActivityLogSchema, 'activity_logs'); 