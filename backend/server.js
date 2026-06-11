require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDatabase } = require("./database");

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const weaknessRoutes = require("./routes/weaknessRoutes");
const cvRoutes = require("./routes/cv");
const adaptiveRoutes = require("./routes/adaptiveInterviewRoutes");
const liveCodingRoutes = require("./routes/liveCodingRoutes");

const app = express();

// ================= CORS =================
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // ✅ fix Express 5

app.use(express.json());

// ================= ROUTES =================
app.use("/", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/cv", cvRoutes);
app.use("/api/weakness", weaknessRoutes);
app.use("/api/activity", require("./routes/activityRoutes")); // ✅ chứa /calendar rồi
app.use("/api/adaptive", adaptiveRoutes);
app.use("/api/live-coding", liveCodingRoutes);

// ================= HEALTH =================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// ================= START =================
const PORT = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    console.log("✅ Database connected successfully");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
