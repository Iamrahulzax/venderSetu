import mongoose, { Document, Schema } from 'mongoose';

export type MovementType =
  | 'initial'
  | 'restock'
  | 'adjustment'
  | 'sale'
  | 'reservation'
  | 'release'
  | 'cancellation'
  | 'wastage'
  | 'damaged'
  | 'expired';

export interface IInventoryMovement extends Document {
  productId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName?: string;
  type: MovementType;
  delta: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  referenceOrderId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: 'System' },
    type: {
      type: String,
      required: true,
      enum: [
        'initial',
        'restock',
        'adjustment',
        'sale',
        'reservation',
        'release',
        'cancellation',
        'wastage',
        'damaged',
        'expired'
      ],
      index: true
    },
    delta: { type: Number, required: true },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    referenceOrderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const InventoryMovement = mongoose.model<IInventoryMovement>('InventoryMovement', inventoryMovementSchema);
