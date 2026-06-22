// backend/controllers/admin/tokenController.js
const fs = require("fs");
const path = require("path");

// Đường dẫn đến file token log
const TOKEN_LOG_PATH = path.join(
  __dirname,
  "..",
  "..",
  "logs",
  "token_usage.log",
);

// Helper: parse log line
function parseTokenLogLine(line) {
  try {
    const log = JSON.parse(line);
    if (log.type === "TOKEN_USAGE" && log.totalTokens) {
      return {
        timestamp: new Date(log.timestamp),
        tokens: log.totalTokens,
        inputTokens: log.inputTokens || 0,
        outputTokens: log.outputTokens || 0,
        feature: log.feature || "general",
        model: log.model || "unknown",
        userId: log.userId || null,
        email: log.email || null,
      };
    }
  } catch (e) {
    // Bỏ qua dòng không parse được
  }
  return null;
}

// Controller: Lấy tổng token hôm nay
exports.getTodayTokens = async (req, res) => {
  try {
    if (!fs.existsSync(TOKEN_LOG_PATH)) {
      return res.status(200).json({
        success: true,
        todayTokens: 0,
        totalTokensAllTime: 0,
        entries: [],
        message: "No token logs found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const fileContent = fs.readFileSync(TOKEN_LOG_PATH, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim());

    let todayTokens = 0;
    let totalTokensAllTime = 0;
    let tokenEntries = [];
    let featureStats = {};

    lines.forEach((line) => {
      const parsed = parseTokenLogLine(line);
      if (parsed) {
        totalTokensAllTime += parsed.tokens;

        // Thống kê theo feature
        if (!featureStats[parsed.feature]) {
          featureStats[parsed.feature] = 0;
        }
        featureStats[parsed.feature] += parsed.tokens;

        // Kiểm tra nếu timestamp trong ngày hôm nay
        if (parsed.timestamp >= today && parsed.timestamp < tomorrow) {
          todayTokens += parsed.tokens;
          tokenEntries.push(parsed);
        }
      }
    });

    // Sắp xếp entries theo thời gian mới nhất
    tokenEntries.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({
      success: true,
      todayTokens,
      totalTokensAllTime,
      entries: tokenEntries.slice(0, 100),
      featureStats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error reading token logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read token logs",
      message: error.message,
    });
  }
};

// Controller: Lấy token theo ngày (cho chart)
exports.getTokenHistory = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const numDays = parseInt(days) || 7;

    if (!fs.existsSync(TOKEN_LOG_PATH)) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No token logs found",
      });
    }

    const fileContent = fs.readFileSync(TOKEN_LOG_PATH, "utf8");
    const lines = fileContent.split("\n").filter((line) => line.trim());

    // Tạo map cho N ngày gần nhất
    const dateMap = new Map();
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split("T")[0];
      dateMap.set(key, {
        date: key,
        tokens: 0,
        count: 0,
        features: {},
      });
    }

    lines.forEach((line) => {
      const parsed = parseTokenLogLine(line);
      if (parsed) {
        const dateKey = parsed.timestamp.toISOString().split("T")[0];
        if (dateMap.has(dateKey)) {
          const entry = dateMap.get(dateKey);
          entry.tokens += parsed.tokens;
          entry.count += 1;

          if (!entry.features[parsed.feature]) {
            entry.features[parsed.feature] = 0;
          }
          entry.features[parsed.feature] += parsed.tokens;
        }
      }
    });

    const result = Array.from(dateMap.values());
    res.status(200).json({
      success: true,
      data: result,
      totalDays: numDays,
    });
  } catch (error) {
    console.error("Error reading token history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read token history",
      message: error.message,
    });
  }
};
