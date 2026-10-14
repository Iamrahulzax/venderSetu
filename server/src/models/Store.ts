import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
  name: string;
  slug: string;
  description: string;
  location: string;
  contactPhone: string;
  isOpen: boolean;
  openingHours: string;
  offersDelivery: boolean;
  deliveryFee: number;
  minimumOrder: number;
  estimatedPrepTime: string;
  bannerImage: string;
  categoryTags: string[];
  ownerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    location: { type: String, default: 'Campus Premises' },
    contactPhone: { type: String, default: '' },
    isOpen: { type: Boolean, default: true, index: true },
    openingHours: { type: String, default: '09:00 AM - 10:00 PM' },
    offersDelivery: { type: Boolean, default: true },
    deliveryFee: { type: Number, default: 0 },
    minimumOrder: { type: Number, default: 0 },
    estimatedPrepTime: { type: String, default: '15-20 mins' },
    bannerImage: { type: String, default: '' },
    categoryTags: [{ type: String }],
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const Store = mongoose.model<IStore>('Store', storeSchema);
