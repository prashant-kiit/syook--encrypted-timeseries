import { Server } from "socket.io";
import { RollingWindowResultModel } from "./model.js";

function getPollingTimeout() {
  const POLLING_TIMEOUT = process.env.POLLING_TIMEOUT;
  if (!POLLING_TIMEOUT || Number.isNaN(POLLING_TIMEOUT)) {
    throw new Error("POLLING_TIMEOUT environment variable is not available");
  }

  return Number(POLLING_TIMEOUT);
}

async function getSuccessRate() {
  const DATA_RANGE = Number(process.env.DATA_RANGE!);
  return await RollingWindowResultModel.find()
    .sort({ windowStart: -1 })
    .limit(DATA_RANGE)
    .lean();
}

function startStreamer(httpServer: any) {
  try {
    const io = new Server(httpServer, {
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
      console.log("Dashboard backend connected");
      const POLLING_TIMEOUT = getPollingTimeout();

      const interval = setInterval(async () => {
        const data = await getSuccessRate();
        console.log("Before streaming", data);
        socket.emit("success-rate", data);
      }, POLLING_TIMEOUT);

      socket.on("disconnect", () => clearInterval(interval));
    });
  } catch (err) {
    console.log("Start Streamer failed due to error", err);
  }
}

export default startStreamer;
