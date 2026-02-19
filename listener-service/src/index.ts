// listener/src/index.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import "dotenv/config";
import { messageQueue } from "./queue.js";

const app = express();
const httpServer = createServer(app);

const LISTENER_PORT = process.env.LISTENER_PORT;
if (!LISTENER_PORT) {
  throw new Error("LISTENER_PORT environment variable is not defined");
}

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

app.get("/", (_, res) => {
  res.send("Listener service running");
});

io.on("connection", (socket) => {
  console.log("Emitter connected:", socket.id);

  socket.on("data-stream", async (payload: string) => {
    console.log("Received stream:", payload);
    const encryptedDataArray = payload.split("|");

    await messageQueue.addBulk(
      encryptedDataArray.map((encryptedData) => ({
        name: "process-message",
        data: { encryptedData },
      })),
    );
  });

  socket.on("disconnect", () => {
    console.log("Emitter disconnected");
  });
});

httpServer.listen(LISTENER_PORT, () => {
  console.log(`Listener running on port ${LISTENER_PORT}`);
});
