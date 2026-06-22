// backend/routes/admin/tokenRoutes.js
const express = require("express");
const router = express.Router();
const tokenController = require("../../controllers/admin/tokenController");

// GET /api/admin/tokens/today - Lấy token hôm nay
router.get("/today", tokenController.getTodayTokens);

// GET /api/admin/tokens/history - Lấy lịch sử token theo ngày
router.get("/history", tokenController.getTokenHistory);

module.exports = router;
