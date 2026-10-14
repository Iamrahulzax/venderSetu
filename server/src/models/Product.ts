import mongoose, { Document, Schema } from 'mongoose';

export type ProductCategory =
  | 'chips'
  | 'kurkure'
  | 'biscuits'
  | 'chocolates'
  | 'cold drinks'
  | 'maggi'
  | 'noodles'
  | 'fast food'
  | 'stationery'
  | 'groceries'
  | 'daily essentials';

export interface IProduct extends Document {
  name: string;
  storeId: mongoose.Types.ObjectId;
  description: string;
  brand: string;
  category: ProductCategory;
  image: string;
  unit: string;
  variant: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isComparable: boolean;
  comparableGroupKey?: string; // e.g. "kurkure-masala-munch-90g" for cross-store price comparison
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    description: { type: String, default: '' },
    brand: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      required: true,
      enum: [
        'chips',
        'kurkure',
        'biscuits',
        'chocolates',
        'cold drinks',
        'maggi',
        'noodles',
        'fast food',
        'stationery',
        'groceries',
        'daily essentials'
      ],
      index: true
    },
    image: { type: String, default: '' },
    unit: { type: String, default: '1 unit' },
    variant: { type: String, default: 'Standard' },
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isComparable: { type: Boolean, default: false, index: true },
    comparableGroupKey: { type: String, trim: true, index: true }
  },
  { timestamps: true }
);

// Compound index for store & name
productSchema.index({ storeId: 1, name: 1 });
productSchema.index({ category: 1, isActive: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
