import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  bio?: string;
  points?: number;
  spottedTrains?: string[];
  profilePhotoUrl?: string;
  resetOtp?: string;
  resetOtpExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    bio: { type: String, trim: true },
    points: { type: Number, default: 0 },
    spottedTrains: [{ type: String }],
    profilePhotoUrl: { type: String },
    resetOtp: { type: String },
    resetOtpExpires: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
