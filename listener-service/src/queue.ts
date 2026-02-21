import { Queue } from "bullmq";
import { Server } from "socket.io";

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
  throw new Error(
    "REDIS_HOST and REDIS_PORT environment variables are not defined",
  );
}

export const redisConnection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
};

const messageQueue = new Queue("message-stream", {
  connection: redisConnection,
});

function startQueue(httpServer: any) {
  try {

    const io = new Server(httpServer, {
      cors: { origin: "*" },
    });
    
    io.on("connection", (socket) => {
      console.log("Emitter connected:", socket.id);
      
      socket.on("data-stream", async (payload: string) => {
        console.log("Received stream");
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
  } catch(err) {
    console.log("Start Queue failed due to error", err);
  }
}

export default startQueue;
