import { Schema, model } from 'mongoose';

interface IFeedback {
  userId: string;
  userEmail: string;
  rating: number;
  message: string;
  category: 'bug' | 'feature' | 'general';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  message: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['bug', 'feature', 'general'],
    default: 'general'
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Feedback = model<IFeedback>('Feedback', feedbackSchema);
