import mongoose, { Document, Schema } from 'mongoose';

export interface ISpotEvent extends Document {
    train: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    createdAt: Date;
}

const spotEventSchema = new Schema({
    train: {
        type: Schema.Types.ObjectId,
        ref: 'Train',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index to query by user or fetch recent global spots quickly
spotEventSchema.index({ createdAt: -1 });

export default mongoose.model<ISpotEvent>('SpotEvent', spotEventSchema);
