import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  userId?: mongoose.Types.ObjectId | null;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Category type must be income or expense'],
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    icon: {
      type: String,
      default: 'Tag',
    },
    color: {
      type: String,
      default: 'blue',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique category per user
categorySchema.index({ userId: 1, name: 1, type: 1 });

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
