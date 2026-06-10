const mongoose = require("mongoose");

const connectMongoDB = async (uri) => {
  try {
    const conn = await mongoose.connect(uri, { dbName: "ai_interview" });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB DISCONNECTED");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB RECONNECTED");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB ERROR:", err.message);
    });

    return conn;
  } catch (error) {
    throw error;
  }
};

const disconnectMongoDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectMongoDB, disconnectMongoDB };
