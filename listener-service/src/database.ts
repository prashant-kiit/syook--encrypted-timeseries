import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error("MONGO_URI environment variable is not defined");
}

const mongoConnection = {
  uri: MONGO_URI,
};

function connectMongoDB() {
  mongoose.connect(mongoConnection.uri);
  console.log("Connected to MongoDB");
}

process.on("SIGINT", async () => await mongoose.connection.close());
process.on("SIGTERM", async () => await mongoose.connection.close());

export default connectMongoDB;
