import express from "express";
import "dotenv/config";
import { promises as fs } from "node:fs";
import { RawDataSchema, type RawData } from "./schema.js";
import { encryptAES, sha256 } from "./crypto.js";

const app = express();

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("PORT environment variable is not defined");
}

async function loadRawData(): Promise<RawData> {
  console.log("Loading raw data from file");
  const path = process.env.RAW_DATA_PATH;
  if (!path) {
    throw new Error("RAW_DATA_PATH environment variable is not defined");
  }
  const file = await fs.readFile(path, "utf-8");
  const data = JSON.parse(file);
  return data;
}

function randomItem(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)] || "";
}

function getEncryptedData(rawData: RawData): string {
  console.log("Getting encrypted data");

  const data = RawDataSchema.parse(rawData);
  console.log("Raw data validated successfully");

  const message = {
    name: randomItem(data.names),
    origin: randomItem(data.cities),
    destination: randomItem(data.cities),
  };

  const checkSumMessage = {
    ...message,
    secret_key: sha256(message),
  };

  const encryptedMessage = encryptAES(JSON.stringify(checkSumMessage));

  return encryptedMessage;
}

function randomCount() {
  return Math.floor(Math.random() * (499 - 49 + 1)) + 49;
}

function generateEncryptedStream(rawData: RawData) {
  console.log("Generating encrypted data stream");
  const messages: string[] = [];
  const count = randomCount();
  for (let i = 0; i < count; i++) {
    const encryptedData = getEncryptedData(rawData);
    messages.push(encryptedData);
  }
  return messages.join("|");
}

function getEmissionTimeInterval(): number {
  const EMISSION_TIME_INTERVAL_STRING = process.env.EMISSION_TIME_INTERVAL;
  if (!EMISSION_TIME_INTERVAL_STRING) {
    throw new Error("EMISSION_TIME_INTERVAL environment variable is not defined");
  }
  const EMISSION_TIME_INTERVAL = Number(EMISSION_TIME_INTERVAL_STRING);

  return EMISSION_TIME_INTERVAL;
}

function emitEncryptedStream(rawData: RawData) {
  console.log("Emitting encrypted data stream");

  const EMISSION_TIME_INTERVAL = getEmissionTimeInterval();
  setInterval(()=> {
    const encryptedStream = generateEncryptedStream(rawData);
    console.log("Encrypted data stream generated successfully");
    console.log(encryptedStream);

  }, EMISSION_TIME_INTERVAL);
}

async function initiateDataEmission() {
  console.log("Data emission initiated");
  try {
    const rawData = await loadRawData();
    console.log("Raw data loaded successfully");
    emitEncryptedStream(rawData);
  } catch (error) {
    console.error("Error during data emission:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Emitter service is running on port ${PORT}`);
  initiateDataEmission();
});
