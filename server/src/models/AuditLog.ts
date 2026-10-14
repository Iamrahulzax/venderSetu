import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: string;
  targetId?: string;
  targetType?: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, default: 'System' },
    actorRole: { type: String, default: 'system' },
    targetId: { type: String },
    targetType: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
