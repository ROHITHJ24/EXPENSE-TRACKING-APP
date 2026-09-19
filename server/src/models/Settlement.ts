import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISettlement extends Document {
  groupId: Types.ObjectId;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  status: 'pending' | 'settled';
  notes?: string;
  settledAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    fromParticipantId: {
      type: String,
      required: true,
    },
    toParticipantId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Settlement amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    status: {
      type: String,
      enum: ['pending', 'settled'],
      default: 'settled',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [150, 'Notes cannot exceed 150 characters'],
    },
    settledAt: {
      type: Date,
      default: Date.now,
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

SettlementSchema.index({ groupId: 1, status: 1 });

export const Settlement = mongoose.model<ISettlement>('Settlement', SettlementSchema);
