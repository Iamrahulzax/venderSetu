import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  orderId?: mongoose.Types.ObjectId;
  subOrderId?: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
  storeName?: string;
  subject: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    subOrderId: { type: Schema.Types.ObjectId, ref: 'SubOrder' },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    storeName: { type: String, default: '' },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open',
      index: true
    },
    adminNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);
