// backend/routes/interviewRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const {
  generateQuestions,
  submitAnswers,
  getHistory,
  deleteHistory,
  getHistoryById,
  getAllInterviews,
  getInterviewStats,
  getInterviewByIdForAdmin,
  deleteInterviewById,
} = require("../controllers/interviewController");

// ============== USER ROUTES ==============
router.post("/generate", auth, generateQuestions);
router.post("/submit", auth, submitAnswers);
router.get("/history", auth, getHistory);
router.delete("/history/:id", auth, deleteHistory);
router.get("/history/:id", auth, getHistoryById);

// ============== ADMIN ROUTES ==============
router.get("/admin/interviews", auth, adminMiddleware, getAllInterviews);
router.get("/admin/interviews/stats", auth, adminMiddleware, getInterviewStats);
router.get(
  "/admin/interviews/:id",
  auth,
  adminMiddleware,
  getInterviewByIdForAdmin,
);
router.delete(
  "/admin/interviews/:id",
  auth,
  adminMiddleware,
  deleteInterviewById,
);

module.exports = router;
