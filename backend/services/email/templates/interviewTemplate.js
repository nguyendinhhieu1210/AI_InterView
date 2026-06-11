// interviewTemplate.js - Complete responsive version
const getInterviewTemplate = (userName, interviewData) => {
  const { topic, difficulty, totalScore, mcqScore, essayScore, completedAt } =
    interviewData;

  // Determine grade and messages based on total score
  let gradeText = "";
  let gradeColor = "";
  let gradeMessage = "";
  let encouragementText = "";

  if (totalScore >= 85) {
    gradeText = "Excellent";
    gradeColor = "#10b981";
    gradeMessage = "🎉 Excellent! You have demonstrated outstanding knowledge.";
    encouragementText =
      "Keep up the great work and challenge yourself with harder topics!";
  } else if (totalScore >= 70) {
    gradeText = "Good";
    gradeColor = "#3b82f6";
    gradeMessage = "👍 Very good! You have a solid grasp of the core concepts.";
    encouragementText = "Review a bit more to achieve even better results!";
  } else if (totalScore >= 50) {
    gradeText = "Fair";
    gradeColor = "#f59e0b";
    gradeMessage = "📚 Not bad! You understand the basics of this topic.";
    encouragementText = "Review the incorrect answers and practice more!";
  } else if (totalScore >= 30) {
    gradeText = "Average";
    gradeColor = "#f97316";
    gradeMessage = "💪 Keep trying! You need to review the material again.";
    encouragementText = "Don't give up, study and try the interview again!";
  } else {
    gradeText = "Needs Improvement";
    gradeColor = "#ef4444";
    gradeMessage = "📖 Below requirements. You need to study more thoroughly.";
    encouragementText =
      "Review the materials and try again. Success will come!";
  }

  // Format date and time
  const formattedDate = new Date(completedAt).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Convert difficulty
  const difficultyText =
    difficulty === "easy"
      ? "Easy"
      : difficulty === "medium"
        ? "Medium"
        : "Hard";

  // Calculate percentages
  const mcqPercent = (mcqScore / 70) * 100;
  const essayPercent = (essayScore / 30) * 100;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Interview Result - ${topic}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f1f5f9;
      line-height: 1.5;
      padding: 16px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Main Container - Responsive */
    .container {
      max-width: 600px;
      width: 100%;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.15);
    }

    /* Header - Bright and clean */
    .header {
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      padding: 32px 24px;
      text-align: center;
      color: white;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.3px;
      margin-bottom: 8px;
      word-break: keep-all;
    }

    .header p {
      font-size: 14px;
      opacity: 0.92;
    }

    /* Content */
    .content {
      padding: 28px 24px;
    }

    /* Greeting */
    .greeting {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #eef2ff;
    }

    .greeting h2 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .topic-badge {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      background: #f8fafc;
      padding: 8px 16px;
      border-radius: 40px;
      font-size: 13px;
      font-weight: 500;
      color: #334155;
      margin-top: 8px;
    }

    /* Score Card */
    .score-card {
      background: ${gradeColor === "#10b981" ? "#ecfdf5" : gradeColor === "#3b82f6" ? "#eff6ff" : gradeColor === "#f59e0b" ? "#fffbeb" : gradeColor === "#f97316" ? "#fff7ed" : "#fef2f2"};
      border-radius: 24px;
      padding: 28px 20px;
      text-align: center;
      margin-bottom: 24px;
      border: 1px solid ${gradeColor}30;
    }

    .score-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .score-value {
      font-size: 64px;
      font-weight: 800;
      color: ${gradeColor};
      line-height: 1;
      margin-bottom: 8px;
    }

    .score-value span {
      font-size: 20px;
      font-weight: 500;
      color: #94a3b8;
    }

    .grade-badge {
      display: inline-block;
      background: ${gradeColor};
      color: white;
      padding: 6px 20px;
      border-radius: 40px;
      font-size: 13px;
      font-weight: 600;
    }

    /* Stats Grid - Responsive */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: #f8fafc;
      border-radius: 20px;
      padding: 20px 16px;
      text-align: center;
    }

    .stat-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .stat-title {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .stat-score {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }

    .stat-score small {
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
    }

    .progress-bar {
      margin-top: 12px;
      height: 6px;
      background: #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: ${gradeColor};
      border-radius: 10px;
    }

    .stat-percent {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
    }

    /* Details Panel */
    .details-panel {
      background: #f8fafc;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .details-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      min-width: 100px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      flex: 1;
      word-break: break-word;
    }

    /* Message Boxes */
    .message-box {
      background: ${gradeColor}10;
      border-left: 4px solid ${gradeColor};
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 16px;
    }

    .message-box p {
      margin: 0;
      color: ${gradeColor === "#f59e0b" ? "#b45309" : gradeColor === "#f97316" ? "#c2410c" : gradeColor};
      font-size: 14px;
      font-weight: 500;
      line-height: 1.5;
    }

    .encouragement {
      background: #fffbeb;
      border-radius: 16px;
      padding: 16px 20px;
      text-align: center;
      margin-bottom: 16px;
    }

    .encouragement p {
      color: #d97706;
      font-size: 14px;
      font-weight: 500;
    }

    .completion {
      background: #f0fdf4;
      border-radius: 16px;
      padding: 12px 16px;
      text-align: center;
    }

    .completion p {
      color: #166534;
      font-size: 13px;
      font-weight: 500;
    }

    /* Footer */
    .footer {
      background: #fafcff;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #eef2ff;
    }

    .footer p {
      color: #94a3b8;
      font-size: 11px;
      margin: 4px 0;
    }

    /* ========== RESPONSIVE ========== */
    @media (max-width: 550px) {
      body {
        padding: 12px;
      }

      .container {
        border-radius: 24px;
      }

      .header {
        padding: 28px 20px;
      }

      .header h1 {
        font-size: 24px;
      }

      .content {
        padding: 20px;
      }

      .greeting h2 {
        font-size: 20px;
      }

      .topic-badge {
        font-size: 12px;
        padding: 6px 14px;
      }

      .score-value {
        font-size: 52px;
      }

      .score-value span {
        font-size: 18px;
      }

      .stats-grid {
        gap: 12px;
      }

      .stat-card {
        padding: 16px 12px;
      }

      .stat-score {
        font-size: 24px;
      }

      .detail-row {
        flex-direction: column;
        gap: 4px;
      }

      .detail-label {
        min-width: auto;
      }
    }

    @media (max-width: 450px) {
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .score-value {
        font-size: 48px;
      }

      .header h1 {
        font-size: 22px;
      }

      .greeting h2 {
        font-size: 18px;
      }
    }

    @media (max-width: 380px) {
      .content {
        padding: 16px;
      }

      .score-card {
        padding: 20px 16px;
      }

      .score-value {
        font-size: 42px;
      }

      .stat-card {
        padding: 14px 12px;
      }

      .message-box,
      .encouragement {
        padding: 14px 16px;
      }
    }

    /* Small height screens */
    @media (max-height: 700px) and (max-width: 550px) {
      body {
        padding: 8px;
      }
      
      .content {
        padding: 16px;
      }
      
      .header {
        padding: 20px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 INTERVIEW RESULT</h1>
      <p>Your performance assessment</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">
        <h2>Hello ${userName}! 👋</h2>
        <div class="topic-badge">
          <span>📌</span> Completed interview on <strong>“${topic}”</strong> · Difficulty: ${difficultyText}
        </div>
      </div>

      <!-- Score Card -->
      <div class="score-card">
        <div class="score-label">Total Score</div>
        <div class="score-value">${totalScore}<span>/100</span></div>
        <div class="grade-badge">🏆 ${gradeText}</div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-title">Multiple Choice</div>
          <div class="stat-score">${mcqScore}<small>/70</small></div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${mcqPercent}%"></div>
          </div>
          <div class="stat-percent">${Math.round(mcqPercent)}% achieved</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✍️</div>
          <div class="stat-title">Essay Questions</div>
          <div class="stat-score">${essayScore}<small>/30</small></div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${essayPercent}%"></div>
          </div>
          <div class="stat-percent">${Math.round(essayPercent)}% achieved</div>
        </div>
      </div>

      <!-- Details -->
      <div class="details-panel">
        <div class="details-title">
          <span>ℹ️</span> Interview Details
        </div>
        <div class="detail-row">
          <div class="detail-label">Topic:</div>
          <div class="detail-value">${topic}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Difficulty:</div>
          <div class="detail-value">${difficultyText}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Completed at:</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
      </div>

      <!-- Messages -->
      <div class="message-box">
        <p>💡 ${gradeMessage}</p>
      </div>
      <div class="encouragement">
        <p>🌟 ${encouragementText}</p>
      </div>
      <div class="completion">
        <p>✅ You have successfully completed this interview</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© 2026 AI Interview System | Powered by Artificial Intelligence</p>
      <p>This email was sent automatically, please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { getInterviewTemplate };
