// server.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");

// Routes
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const weaknessRoutes = require("./routes/weaknessRoutes");
const cvRoutes = require("./routes/cv");
const adaptiveRoutes = require("./routes/adaptiveInterviewRoutes");
const liveCodingRoutes = require("./routes/liveCodingRoutes");

// Database
const { connectDatabase } = require("./database");

// =======================
// 1. INIT APP (PHẢI ĐẦU TIÊN)
// =======================
const app = express();

// =======================
// 2. MIDDLEWARE
// =======================

app.use(express.json());

// CORS (CHỈ 1 LẦN DUY NHẤT)
app.use(
  cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", cors());

// =======================
// 3. ROUTES
// =======================

app.use("/", healthRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/cv", cvRoutes);
app.use("/api/weakness", weaknessRoutes);
app.use("/api/activity", require("./routes/activityRoutes"));
app.use("/api/adaptive", adaptiveRoutes);
app.use("/api/live-coding", liveCodingRoutes);

// =======================
// 4. HEALTH CHECK
// =======================

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// =======================
// 5. DATABASE + START SERVER
// =======================

const PORT = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
