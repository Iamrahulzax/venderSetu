import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'order_update' | 'low_stock' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order_update', 'low_stock', 'system'], default: 'order_update' },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
