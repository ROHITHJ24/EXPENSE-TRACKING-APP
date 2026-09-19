import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IParticipant {
  _id: string;
  name: string;
  email?: string;
  linkedUserId?: Types.ObjectId;
}

export interface IGroup extends Document {
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  participants: IParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    _id: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    linkedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

const GroupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    participants: {
      type: [ParticipantSchema],
      validate: [
        (val: IParticipant[]) => val.length >= 1,
        'Group must have at least one participant',
      ],
    },
  },
  {
    timestamps: true,
  }
);

GroupSchema.index({ createdBy: 1, createdAt: -1 });

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
