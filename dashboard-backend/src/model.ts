import mongoose from "mongoose";

export const RollingWindowResultModel = mongoose.model(
    "rolling_window_results",
    new mongoose.Schema({}, { strict: false }),
    "rolling_window_results",
  );

