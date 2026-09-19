import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecurringExpense extends Document {
  userId: Types.ObjectId;
  title: string;
  amount: number;
  categoryId: Types.ObjectId;
  frequency: 'monthly' | 'weekly' | 'yearly';
  dueDay: number; // 1 to 31
  startDate: Date;
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringExpenseSchema = new Schema<IRecurringExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    frequency: {
      type: String,
      enum: ['monthly', 'weekly', 'yearly'],
      default: 'monthly',
    },
    dueDay: {
      type: Number,
      required: [true, 'Due day of month is required'],
      min: [1, 'Due day must be between 1 and 31'],
      max: [31, 'Due day must be between 1 and 31'],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters'],
    },
  },
  {
    timestamps: true,
  }
);

RecurringExpenseSchema.index({ userId: 1, active: 1 });

export const RecurringExpense = mongoose.model<IRecurringExpense>(
  'RecurringExpense',
  RecurringExpenseSchema
);
