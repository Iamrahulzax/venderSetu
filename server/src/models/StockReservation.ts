import mongoose, { Document, Schema } from 'mongoose';

export interface IReservedItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IStockReservation extends Document {
  reservationToken: string;
  userId: mongoose.Types.ObjectId;
  items: IReservedItem[];
  expiresAt: Date;
  status: 'active' | 'committed' | 'released';
  createdAt: Date;
}

const stockReservationSchema = new Schema<IStockReservation>(
  {
    reservationToken: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 }
      }
    ],
    expiresAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ['active', 'committed', 'released'], default: 'active', index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const StockReservation = mongoose.model<IStockReservation>('StockReservation', stockReservationSchema);
