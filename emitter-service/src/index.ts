const express = require("express");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT;
if (!PORT) {
  throw new Error("PORT environment variable is not defined");
}

function initiateDataEmission() {
  try {
    console.log("Data emission initiated");
  } catch (error) {
    console.error("Error during data emission:", error);
  }
}

app.listen(PORT, () => {
  initiateDataEmission();
  console.log(`Emitter service is running on port ${PORT}`);
});
