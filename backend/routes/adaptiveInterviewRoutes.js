const express = require("express");
const router = express.Router();
const adaptiveController = require("../controllers/adaptiveInterviewController");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/admin");

// Tất cả đều yêu cầu đăng nhập
router.use(auth);

// User routes
router.post("/start", adaptiveController.startAdaptiveInterview);
router.post("/answer", adaptiveController.submitAnswer);
router.get("/session/:sessionId", adaptiveController.getSession);
router.get("/history", adaptiveController.getHistory);

// Admin routes (thêm adminAuth)
router.get("/admin/sessions", adminAuth, adaptiveController.getAllSessions);
router.get(
  "/admin/session/:sessionId",
  adminAuth,
  adaptiveController.getSessionDetail,
);
router.delete(
  "/admin/session/:sessionId",
  adminAuth,
  adaptiveController.deleteSession,
);

module.exports = router;
