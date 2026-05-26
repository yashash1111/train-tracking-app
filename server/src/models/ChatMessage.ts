import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  trainId: string;
  username: string;
  message: string;
  timestamp: Date;
}

const chatMessageSchema: Schema = new Schema(
  {
    trainId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
