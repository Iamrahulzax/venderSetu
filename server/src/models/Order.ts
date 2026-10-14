import mongoose, { Document, Schema } from 'mongoose';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cash_on_pickup' | 'pay_at_store';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refund_pending' | 'refunded';

export interface IOrder extends Document {
  orderNumber: string;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  suborders: mongoose.Types.ObjectId[];
  totalAmount: number;
  deliveryTotal: number;
  itemsTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paidAt?: Date;
    failureReason?: string;
  };
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentPhone: { type: String, default: '' },
    suborders: [{ type: Schema.Types.ObjectId, ref: 'SubOrder' }],
    totalAmount: { type: Number, required: true },
    deliveryTotal: { type: Number, default: 0 },
    itemsTotal: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'cash_on_pickup', 'pay_at_store'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refund_pending', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentDetails: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      paidAt: { type: Date },
      failureReason: { type: String }
    },
    fulfillmentType: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    deliveryAddress: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
