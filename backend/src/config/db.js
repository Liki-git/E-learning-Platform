const mongoose = require("mongoose");

const connectToUri = async (uri) => {
  return mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: 10000,
  });
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/lisha_academy";

  try {
    await connectToUri(mongoUri);
    console.log("MongoDB connected");
    return;
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error);

    if (
      mongoUri.startsWith("mongodb+srv://") &&
      /(querySrv|ECONNREFUSED|ENOTFOUND)/i.test(error.message)
    ) {
      const localFallback = "mongodb://127.0.0.1:27017/lisha_academy";
      console.warn(
        "Atlas SRV DNS lookup failed. Attempting local MongoDB fallback at",
        localFallback
      );

      try {
        await connectToUri(localFallback);
        console.log("MongoDB connected to local fallback");
        return;
      } catch (fallbackError) {
        console.error("Local MongoDB fallback also failed:", fallbackError.message);
      }
    }

    console.error(
      "Verify your MONGO_URI, network/DNS access, and that MongoDB is running. For local development, use a local MongoDB URI in .env."
    );
    process.exit(1);
  }
};

module.exports = connectDB;
