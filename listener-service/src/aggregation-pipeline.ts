import mongoose from "mongoose";
import { MessageModel, RollingWindowResultModel } from "./model.js";

function getRollingWindow() {
  if (
    !process.env.ROLLING_WINDOW_MINUTES ||
    Number.isNaN(process.env.ROLLING_WINDOW_MINUTES)
  ) {
    throw new Error(
      "ROLLING_WINDOW_MINUTES environment variable is not defined",
    );
  }

  const ROLLING_WINDOW_MINUTES = Number(process.env.ROLLING_WINDOW_MINUTES);
  return ROLLING_WINDOW_MINUTES;
}

function getMongoDBChangeWatcher() {
  const changeStream = MessageModel.watch(
    [
      {
        $match: {
          operationType: { $in: ["insert", "update", "replace"] },
        },
      },
    ],
    { fullDocument: "updateLookup" },
  );

  return changeStream;
}

async function shutdown(changeStream: mongoose.mongo.ChangeStream<any, any>) {
  await changeStream.close();
  console.log("Change stream closed.");
  process.exit(0);
}

async function getRollingWindowSuccessRate(windowStart: Date, now: Date) {
  const result = await MessageModel.aggregate([
    {
      $match: {
        minuteBucket: { $gte: windowStart, $lte: now },
      },
    },
    { $unwind: "$records" },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ["$records.isSuccess", true] }, 1, 0] },
        },
        failCount: {
          $sum: { $cond: [{ $eq: ["$records.isSuccess", false] }, 1, 0] },
        },
        bucketsInWindow: { $addToSet: "$minuteBucket" },
      },
    },
    {
      $project: {
        _id: 0,
        windowStart: { $literal: windowStart },
        windowEnd: { $literal: now },
        totalRecords: 1,
        successCount: 1,
        failCount: 1,
        bucketsCovered: { $size: "$bucketsInWindow" },
        successRate: {
          $multiply: [
            {
              $cond: [
                { $eq: ["$totalRecords", 0] },
                0,
                { $divide: ["$successCount", "$totalRecords"] },
              ],
            },
            100,
          ],
        },
      },
    },
    {
      $addFields: {
        computedAt: { $literal: now },
      },
    },
  ]);

  return result;
}

async function onChangeCallack() {
  const ROLLING_WINDOW_MINUTES = getRollingWindow();

  const now = new Date();
  const windowStart = new Date(
    now.getTime() - ROLLING_WINDOW_MINUTES * 60 * 1000,
  );

  const result = await getRollingWindowSuccessRate(windowStart, now);

  if (result.length === 0) {
    throw new Error("No records found in the rolling window.");
  }

  const data = result[0];

  await RollingWindowResultModel.findOneAndUpdate(
    { windowStart: data.windowStart },
    { $set: data },
    { upsert: true, new: true },
  );

  console.log("Rolling Window Success Rate:", {
    window: `${windowStart.toISOString()} → ${now.toISOString()}`,
    ...data,
    successRate: `${data.successRate.toFixed(2)}%`,
  });
}

function onErrorCallback(err: Error) {
  console.error("Change stream error:", err);
  setTimeout(startRollingWindowStream, 5000);
}

function startRollingWindowStream() {
  const changeStream = getMongoDBChangeWatcher();
  console.log("Watching for MongoDB Changes...");

  changeStream.on("change", onChangeCallack);
  changeStream.on("error", (err) => onErrorCallback(err));

  process.on("SIGINT", () => shutdown(changeStream));
  process.on("SIGTERM", () => shutdown(changeStream));
}

export default startRollingWindowStream;
