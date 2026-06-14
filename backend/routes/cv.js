// backend/routes/cv.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const cvController = require("../controllers/cvController");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const upload = multer({ dest: "uploads/" });

// ==================== USER ROUTES ====================
router.post("/upload", auth, upload.single("cv"), cvController.uploadCV);
router.post("/analyze-text", cvController.analyzeCVText);
router.post("/generate-questions", cvController.generateQuestionsFromText);
router.post("/submit-answers", auth, cvController.submitCVAnswers);
router.get("/history", auth, cvController.getCVSessionHistory);
router.get("/history/:id", auth, cvController.getCVSessionDetail);

// ==================== ADMIN ROUTES ====================
router.get(
  "/admin/sessions",
  auth,
  adminMiddleware,
  cvController.getAllCVSessions,
);
router.get(
  "/admin/sessions/:id",
  auth,
  adminMiddleware,
  cvController.getCVSessionByIdForAdmin,
);
router.delete(
  "/admin/sessions/:id",
  auth,
  adminMiddleware,
  cvController.deleteCVSessionById,
);

module.exports = router;
