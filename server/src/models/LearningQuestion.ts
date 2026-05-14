import mongoose, { Schema, type Document } from 'mongoose'

export interface ILearningQuestion extends Document {
  question: string
  answer: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  is_active: boolean
}

const learningQuestionSchema = new Schema<ILearningQuestion>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const LearningQuestion = mongoose.model<ILearningQuestion>('LearningQuestion', learningQuestionSchema)
