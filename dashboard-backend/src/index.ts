import express from "express";
import { createServer } from "http";
import "dotenv/config";
import connectMongoDB from "./database.js";
import startStreamer from "./streamer.js";

const app = express();
const httpServer = createServer(app);

const LISTENER_PORT = process.env.LISTENER_PORT;
if (!LISTENER_PORT) {
  throw new Error("LISTENER_PORT environment variable is not defined");
}

connectMongoDB();
startStreamer(httpServer);

httpServer.listen(LISTENER_PORT, () => {
  console.log(`Dashboard Backedn running on port ${LISTENER_PORT}`);
});
