import { Queue } from "bullmq";

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
  throw new Error("REDIS_HOST and REDIS_PORT environment variables are not defined");
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI environment variable is not defined");
}

export const redisConnection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
};

export const messageQueue = new Queue("message-stream", {
  connection: redisConnection,
});

export const mongoConnection = {
  uri: MONGO_URI,
};
