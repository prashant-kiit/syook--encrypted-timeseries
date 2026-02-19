import mongoose from "mongoose";

const RecordSchema = new mongoose.Schema(
  {
    name: String,
    origin: String,
    destination: String,
    receivedAt: Date,
  },
  { _id: false }
);

const TimeSeriesSchema = new mongoose.Schema(
  {
    minuteBucket: Date,
    records: [RecordSchema],
  },
  { versionKey: false }
);

export const MessageModel = mongoose.model(
  "message_timeseries",
  TimeSeriesSchema,
  "message_timeseries"
);