import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'seller' | 'admin';
  phone?: string;
  studentId?: string;
  hostelRoom?: string;
  assignedStoreId?: mongoose.Types.ObjectId;
  isApproved: boolean;
  status: 'active' | 'suspended';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'seller', 'admin'], default: 'student', index: true },
    phone: { type: String, trim: true },
    studentId: { type: String, trim: true },
    hostelRoom: { type: String, trim: true },
    assignedStoreId: { type: Schema.Types.ObjectId, ref: 'Store', default: null, index: true },
    isApproved: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
