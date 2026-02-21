import express from "express";
import { createServer } from "http";
import "dotenv/config";
import startQueue from "./queue.js";
import startWorker from "./worker.js";
import startRollingWindowStream from "./aggregation-pipeline.js";
import connectMongoDB from "./database.js";

const app = express();
const httpServer = createServer(app);

const LISTENER_PORT = process.env.LISTENER_PORT;
if (!LISTENER_PORT) {
  throw new Error("LISTENER_PORT environment variable is not defined");
}

startQueue(httpServer);
connectMongoDB();
startRollingWindowStream();
startWorker();

httpServer.listen(LISTENER_PORT, () => {
  console.log(`Listener running on port ${LISTENER_PORT}`);
});
