import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeLog extends Document {
  userId: mongoose.Types.ObjectId;
  description: string;
  project: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // duration in seconds
  createdAt: Date;
  updatedAt: Date;
}

const timeLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true, trim: true },
    project: { type: String, required: true, trim: true, default: 'General' },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ITimeLog>('TimeLog', timeLogSchema);
