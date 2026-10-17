import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  quantity: number;
  selectedVariant?: {
    name: string;
    price: number;
  };
  selectedAddons?: Array<{
    name: string;
    price: number;
  }>;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedVariant: {
      name: { type: String },
      price: { type: Number }
    },
    selectedAddons: [
      {
        name: { type: String },
        price: { type: Number }
      }
    ]
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [cartItemSchema]
  },
  { timestamps: true }
);

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
