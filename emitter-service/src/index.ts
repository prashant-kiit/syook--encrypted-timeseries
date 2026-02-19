const express = require("express");
require("dotenv").config();
const { promises } = require("fs");

const app = express();

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("PORT environment variable is not defined");
}

async function loadRawData() {
  const path = process.env.RAW_DATA_PATH;
  const file = await promises.readFile(path, "utf-8");
  const data = JSON.parse(file);
  return data;
}

async function initiateDataEmission() {
  try {
    const rawData = await loadRawData();
    console.log("Raw data loaded successfully");
    console.log("Data emission initiated");
  } catch (error) {
    console.error("Error during data emission:", error);
  }
}

app.listen(PORT, () => {
  console.log(`Emitter service is running on port ${PORT}`);
  initiateDataEmission();
});
