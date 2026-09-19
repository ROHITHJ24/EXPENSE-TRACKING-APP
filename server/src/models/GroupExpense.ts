import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExpenseSplit {
  participantId: string;
  shareAmount: number;
  rawValue?: number; // e.g. custom percentage or shares value
}

export interface IGroupExpense extends Document {
  groupId: Types.ObjectId;
  title: string;
  amount: number;
  date: Date;
  categoryId?: Types.ObjectId;
  paidBy: string; // participantId
  splitMethod: 'equal' | 'custom' | 'percentage' | 'shares';
  splits: IExpenseSplit[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSplitSchema = new Schema<IExpenseSplit>(
  {
    participantId: {
      type: String,
      required: true,
    },
    shareAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    rawValue: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const GroupExpenseSchema = new Schema<IGroupExpense>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    paidBy: {
      type: String,
      required: [true, 'Payer participant ID is required'],
    },
    splitMethod: {
      type: String,
      enum: ['equal', 'custom', 'percentage', 'shares'],
      default: 'equal',
    },
    splits: {
      type: [ExpenseSplitSchema],
      required: true,
      validate: [
        (val: IExpenseSplit[]) => val.length >= 1,
        'At least one participant split is required',
      ],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

GroupExpenseSchema.index({ groupId: 1, date: -1 });

export const GroupExpense = mongoose.model<IGroupExpense>('GroupExpense', GroupExpenseSchema);
