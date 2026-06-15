// backend/routes/liveCodingRoutes.js
const express = require("express");
const router = express.Router();
const liveCodingController = require("../controllers/liveCodingController");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

router.use(auth);

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// === Các API không cần session (lấy domains/topics tĩnh) ===
router.get("/domains", asyncHandler(liveCodingController.getDomainsByLanguage));
router.get(
  "/topics",
  asyncHandler(liveCodingController.getTopicsByLanguageAndDomain),
);

// === Bắt đầu interview (tạo session tạm) ===
router.post("/start", asyncHandler(liveCodingController.startInterview));

// === Các API cần sessionId (làm việc với session tạm) ===
router.get(
  "/session/:sessionId/current-question",
  asyncHandler(liveCodingController.getCurrentQuestion),
);
router.post(
  "/session/:sessionId/submit",
  asyncHandler(liveCodingController.submitCode),
);
router.post(
  "/session/:sessionId/explain",
  asyncHandler(liveCodingController.submitExplanation),
);
router.post(
  "/session/:sessionId/next-code",
  asyncHandler(liveCodingController.nextCodeQuestion),
);

// === Lấy đánh giá cuối cùng (đã lưu trong DB) ===
router.get(
  "/session/:sessionId/last-evaluation",
  asyncHandler(liveCodingController.getLastEvaluation),
);
router.get("/history", asyncHandler(liveCodingController.getSessionList));
router.get(
  "/sessions/:sessionId",
  asyncHandler(liveCodingController.getSessionDetail),
);

// ============== ADMIN ROUTES ==============
router.get(
  "/admin/sessions",
  auth,
  adminMiddleware,
  asyncHandler(liveCodingController.getAllCodingSessions),
);
router.get(
  "/admin/sessions/:id",
  auth,
  adminMiddleware,
  asyncHandler(liveCodingController.getCodingSessionByIdForAdmin),
);
router.delete(
  "/admin/sessions/:id",
  auth,
  adminMiddleware,
  asyncHandler(liveCodingController.deleteCodingSessionById),
);

module.exports = router;
