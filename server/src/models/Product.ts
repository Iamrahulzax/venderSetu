import mongoose, { Document, Schema } from 'mongoose';

export type ProductCategory = string;

export interface IProductVariant {
  name: string;
  price: number;
  inStock?: boolean;
}

export interface IProductAddon {
  name: string;
  price: number;
}

export interface IProduct extends Document {
  name: string;
  storeId: mongoose.Types.ObjectId;
  description: string;
  brand: string;
  category: ProductCategory;
  image: string;
  imageUrl?: string;
  images?: string[];
  imageSource?: 'openfoodfacts' | 'merchant' | 'wikimedia' | 'licensed' | 'official' | 'curated';
  imageAttribution?: string;
  imageLicense?: string;
  imageVerified?: boolean;
  barcode?: string;
  unit: string;
  variant: string;
  variants?: IProductVariant[];
  addons?: IProductAddon[];
  isVeg?: boolean;
  servingSize?: string;
  prepTime?: string;
  isAvailable?: boolean;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isComparable: boolean;
  comparableGroupKey?: string; // e.g. "kurkure-masala-munch-90g" for cross-store price comparison
  sku?: string;
  expiryDate?: Date;
  displayOrder?: number;
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
      trim: true,
      lowercase: true,
      index: true
    },
    image: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    images: [{ type: String }],
    imageSource: {
      type: String,
      enum: ['openfoodfacts', 'merchant', 'wikimedia', 'licensed', 'official', 'curated'],
      default: 'curated'
    },
    imageAttribution: { type: String, default: '' },
    imageLicense: { type: String, default: '' },
    imageVerified: { type: Boolean, default: false },
    barcode: { type: String, trim: true, index: true },
    unit: { type: String, default: '1 unit' },
    variant: { type: String, default: 'Standard' },
    variants: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        inStock: { type: Boolean, default: true }
      }
    ],
    addons: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true }
      }
    ],
    isVeg: { type: Boolean, default: true, index: true },
    servingSize: { type: String, default: '' },
    prepTime: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true, index: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isComparable: { type: Boolean, default: false, index: true },
    comparableGroupKey: { type: String, trim: true, index: true },
    sku: { type: String, trim: true, index: true },
    expiryDate: { type: Date },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Compound indexes
productSchema.index({ storeId: 1, name: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ storeId: 1, isAvailable: 1 });

// Ensure image and imageUrl are kept in sync
productSchema.pre('save', function (next) {
  if (this.imageUrl && !this.image) {
    this.image = this.imageUrl;
  } else if (this.image && !this.imageUrl) {
    this.imageUrl = this.image;
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
