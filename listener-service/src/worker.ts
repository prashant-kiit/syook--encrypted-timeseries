import { Worker } from "bullmq";
import mongoose from "mongoose";
import { connection } from "./queue.js";
import { decryptAES, sha256 } from "./crypto.js";
import { MessageSchema, type Message, type DecryptedData } from "./schema.js";
import { MessageModel } from "./model.js";

function getMinuteBucket(date: Date): Date {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

function validateJobDataSchema(jobData: { encryptedData: string }): Message {
  console.log("Validating job data");
  const { encryptedData } = jobData;
  if (!encryptedData) {
    throw new Error("Job data does not contain encryptedData");
  }
  const decryptedDataString = decryptAES(encryptedData);
  const decryptedDataJSON = MessageSchema.parse(
    JSON.parse(decryptedDataString),
  );
  return decryptedDataJSON;
}

function isDecryptedDataValid(decryptedDataJSON: Message): {
  success: boolean;
  decryptedData: DecryptedData;
} {
  console.log("Verifying decrypted data");
  const { secret_key, ...original } = decryptedDataJSON;

  if (sha256(original) !== secret_key) {
    return { success: false, decryptedData: original };
  }
  return { success: true, decryptedData: original };
}

async function storeDataInDB(success: boolean, decryptedData: DecryptedData) {
  console.log("Storing data in DB");
  const receivedAt = new Date();
  const minuteBucket = getMinuteBucket(receivedAt);

  await MessageModel.updateOne(
    { minuteBucket },
    {
      $push: {
        records: { ...decryptedData, isSuccess: success, receivedAt },
      },
    },
    { upsert: true },
  );
}

const workerCallback = async (job: any) => {
  console.log("Processing job with id:", job.id);
  try {
    const decryptedDataJSON = validateJobDataSchema(job.data);
    console.log("Job data validated successfully");

    const isValid = isDecryptedDataValid(decryptedDataJSON);

    console.log("Job data integrity verified successfully");

    await storeDataInDB(isValid.success, isValid.decryptedData);
    console.log("Job completed successfully");
  } catch (err) {
    console.error("Job failed:", err);
    throw err;
  }
};

async function shutdown(worker: Worker) {
  console.log("Closing worker and MongoDB connection...");
  await worker.close();
  await mongoose.connection.close();
  process.exit(0);
}

function startWorker() {
  try {
    console.log("Worker started...");

    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }
    mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const worker = new Worker("message-stream", workerCallback, {
      connection,
      concurrency: 20,
    });

    process.on("SIGINT", () => shutdown(worker));
    process.on("SIGTERM", () => shutdown(worker));

    console.log("Worker is listening to the message-stream queue");
  } catch (err) {
    console.error("Worker failed to start:", err);
  }
}

export default startWorker;
