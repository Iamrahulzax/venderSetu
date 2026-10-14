import mongoose, { Document, Schema } from 'mongoose';

export type SubOrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface ISubOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  unit: string;
  subtotal: number;
}

export interface ISubOrder extends Document {
  subOrderNumber: string;
  orderId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  items: ISubOrderItem[];
  itemsSubtotal: number;
  deliveryFee: number;
  totalAmount: number;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  notes?: string;
  status: SubOrderStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  acceptedAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subOrderItemSchema = new Schema<ISubOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    category: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    costPrice: { type: Number, required: true },
    unit: { type: String, default: '1 unit' },
    subtotal: { type: Number, required: true }
  },
  { _id: false }
);

const subOrderSchema = new Schema<ISubOrder>(
  {
    subOrderNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    studentPhone: { type: String, default: '' },
    studentEmail: { type: String, default: '' },
    items: [subOrderItemSchema],
    itemsSubtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    fulfillmentType: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    deliveryAddress: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'preparing',
        'ready_for_pickup',
        'out_for_delivery',
        'completed',
        'rejected',
        'cancelled'
      ],
      default: 'pending',
      index: true
    },
    rejectionReason: { type: String },
    cancellationReason: { type: String },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    acceptedAt: { type: Date },
    readyAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date }
  },
  { timestamps: true }
);

export const SubOrder = mongoose.model<ISubOrder>('SubOrder', subOrderSchema);
