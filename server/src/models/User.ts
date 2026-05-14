import mongoose, { Schema, type Document, type Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export const ROLES = ['client', 'moderator', 'admin', 'super_admin'] as const
export type UserRole = (typeof ROLES)[number]

export interface IUser extends Document {
  name: string
  email: string
  password_hash: string
  role: UserRole
  status: 'active' | 'suspended'
  refresh_token?: string
  comparePassword(password: string): Promise<boolean>
}

interface UserModel extends Model<IUser> {
  hashPassword(password: string): Promise<string>
}

const userSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'client' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    refresh_token: { type: String, select: false },
  },
  { timestamps: true },
)

userSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.password_hash as string)
}

userSchema.statics.hashPassword = (password: string) => bcrypt.hash(password, 12)

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password_hash
    delete ret.refresh_token
    delete ret.__v
    return ret
  },
})

export const User = mongoose.model<IUser, UserModel>('User', userSchema)
