import mongoose from "mongoose";

const RecordSchema = new mongoose.Schema(
  {
    name: String,
    origin: String,
    destination: String,
    isSuccess: Boolean,
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

const RollingWindowResultSchema = new mongoose.Schema(
  {
    windowStart: { type: Date, required: true, unique: true },
    windowEnd: Date,
    totalRecords: Number,
    successCount: Number,
    failCount: Number,
    bucketsCovered: Number,
    successRate: Number,
    computedAt: Date,
  },
  { versionKey: false }
);

export const RollingWindowResultModel = mongoose.model(
  "rolling_window_results",
  RollingWindowResultSchema,
  "rolling_window_results"
);