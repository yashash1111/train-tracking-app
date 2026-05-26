import mongoose, { Document, Schema } from 'mongoose';

export interface IStop {
  stationName: string;
  code: string;
  arrival: string;
  departure: string;
  platform?: string;
  delay?: number;
  latitude: number;
  longitude: number;
}

export interface ILiveLocation {
  latitude: number;
  longitude: number;
  speed: number;
  current_station_id?: string;
  last_updated: Date;
}

export interface ITrain extends Document {
  number: string;
  name: string;
  type: string;
  routes: {
    source_station: { code: string; name: string };
    destination_station: { code: string; name: string };
    stops: IStop[];
  }[];
  live_location?: ILiveLocation;
  createdAt: Date;
  updatedAt: Date;
}

const stopSchema = new Schema({
  stationName: { type: String, required: true },
  code: { type: String, required: true, uppercase: true },
  arrival: { type: String, required: true },
  departure: { type: String, required: true },
  platform: { type: String, default: 'PF 1' },
  delay: { type: Number, default: 0 },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

const routeSchema = new Schema({
  source_station: {
    code: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
  },
  destination_station: {
    code: { type: String, required: true, uppercase: true },
    name: { type: String, required: true },
  },
  stops: [stopSchema],
});

const liveLocationSchema = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  current_station_id: { type: String },
  last_updated: { type: Date, default: Date.now },
});

const trainSchema: Schema = new Schema(
  {
    number: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true },
    routes: [routeSchema],
    live_location: liveLocationSchema,
  },
  { timestamps: true }
);

export default mongoose.model<ITrain>('Train', trainSchema);
