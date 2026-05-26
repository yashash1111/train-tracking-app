import mongoose, { Document, Schema } from 'mongoose';

export interface IStation extends Document {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

const stationSchema: Schema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IStation>('Station', stationSchema);
