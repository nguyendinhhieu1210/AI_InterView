// interviewTemplate.js - Complete fixed version
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Result - ${topic}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      background: #f0f2f5;
      margin: 0;
      padding: 24px 16px;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 32px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.08);
    }
    /* Header */
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 36px 28px;
      text-align: center;
      color: white;
    }
    .header h1 {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.3px;
    }
    .header p {
      opacity: 0.85;
      font-size: 14px;
    }
    /* Content */
    .content {
      padding: 28px;
    }
    /* Greeting */
    .greeting {
      margin-bottom: 28px;
    }
    .greeting h2 {
      color: #1e293b;
      font-size: 20px;
      font-weight: 600;
    }
    .greeting p {
      color: #64748b;
      margin-top: 6px;
      font-size: 14px;
    }
    /* Score Card */
    .score-card {
      background: linear-gradient(135deg, ${gradeColor}10 0%, ${gradeColor}05 100%);
      border-radius: 24px;
      padding: 28px 20px;
      text-align: center;
      margin-bottom: 28px;
      border: 1px solid ${gradeColor}25;
    }
    .score-label {
      font-size: 13px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .score-value {
      font-size: 56px;
      font-weight: 800;
      color: ${gradeColor};
      line-height: 1.1;
    }
    .score-max {
      font-size: 18px;
      color: #94a3b8;
      font-weight: 500;
    }
    .grade-badge {
      display: inline-block;
      background: ${gradeColor};
      color: white;
      padding: 5px 18px;
      border-radius: 40px;
      font-size: 13px;
      font-weight: 600;
      margin-top: 16px;
    }
    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: #f8fafc;
      border-radius: 20px;
      padding: 20px 16px;
      text-align: center;
      transition: all 0.2s;
    }
    .stat-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .stat-label {
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
      line-height: 1.2;
    }
    .stat-max {
      font-size: 13px;
      color: #94a3b8;
      font-weight: 500;
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
      transition: width 0.3s ease;
    }
    .stat-percent {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
    }
    /* Info Section - Fixed with proper inline format */
    .info-section {
      background: #f8fafc;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .info-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
    }
    .info-item {
      display: flex;
      align-items: baseline;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-item:last-child {
      border-bottom: none;
    }
    .info-label {
      min-width: 110px;
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-size: 14px;
      font-weight: 600;
      flex: 1;
    }
    /* Message Box */
    .message-box {
      background: ${gradeColor}10;
      border-left: 4px solid ${gradeColor};
      border-radius: 16px;
      padding: 18px 20px;
      margin-bottom: 20px;
    }
    .message-box p {
      margin: 0;
      color: ${gradeColor === "#f59e0b" ? "#b45309" : gradeColor === "#f97316" ? "#c2410c" : gradeColor};
      font-size: 14px;
      font-weight: 500;
      line-height: 1.5;
    }
    /* Encouragement */
    .encouragement {
      background: #fef9e3;
      border-radius: 16px;
      padding: 16px 20px;
      text-align: center;
      margin-bottom: 28px;
    }
    .encouragement p {
      color: #d97706;
      font-size: 14px;
      margin: 0;
      font-weight: 500;
    }
    /* Completion Note */
    .completion-note {
      text-align: center;
      margin-bottom: 16px;
      padding: 12px;
      background: #f0fdf4;
      border-radius: 12px;
    }
    .completion-note p {
      margin: 0;
      color: #166534;
      font-size: 13px;
      font-weight: 500;
    }
    /* Footer */
    .footer {
      background: #fafcff;
      padding: 20px 28px;
      text-align: center;
      border-top: 1px solid #eef2ff;
    }
    .footer p {
      color: #94a3b8;
      font-size: 11px;
      margin: 6px 0;
    }
    /* Responsive */
    @media (max-width: 480px) {
      .container {
        border-radius: 24px;
      }
      .header {
        padding: 28px 20px;
      }
      .header h1 {
        font-size: 22px;
      }
      .content {
        padding: 20px;
      }
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .score-value {
        font-size: 44px;
      }
      .stat-score {
        font-size: 24px;
      }
      .info-item {
        flex-direction: column;
        gap: 6px;
      }
      .info-label {
        min-width: auto;
      }
      .greeting h2 {
        font-size: 18px;
      }
    }
    @media (max-width: 380px) {
      .content {
        padding: 16px;
      }
      .stat-card {
        padding: 16px;
      }
      .message-box {
        padding: 14px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎯 INTERVIEW RESULT</h1>
      <p>Your performance assessment</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">
        <h2>Hello ${userName}!</h2>
        <p>You've completed the interview on <strong>“${topic}”</strong></p>
      </div>

      <!-- Score Card -->
      <div class="score-card">
        <div class="score-label">Total Score</div>
        <div class="score-value">${totalScore}<span class="score-max">/100</span></div>
        <div class="grade-badge">🏆 ${gradeText}</div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <!-- MCQ Card -->
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-label">Multiple Choice</div>
          <div class="stat-score">${mcqScore}<span class="stat-max">/70</span></div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${mcqPercent}%"></div>
          </div>
          <div class="stat-percent">${Math.round(mcqPercent)}% achieved</div>
        </div>
        <!-- Essay Card -->
        <div class="stat-card">
          <div class="stat-icon">✍️</div>
          <div class="stat-label">Essay Questions</div>
          <div class="stat-score">${essayScore}<span class="stat-max">/30</span></div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${essayPercent}%"></div>
          </div>
          <div class="stat-percent">${Math.round(essayPercent)}% achieved</div>
        </div>
      </div>

      <!-- Info Section - Fixed format: Topic: React, Difficulty: Easy, Completed at: date -->
      <div class="info-section">
        <div class="info-title">
          <span>ℹ️</span> Interview Details
        </div>
        <div class="info-item">
          <div class="info-label">Topic:</div>
          <div class="info-value">${topic}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Difficulty:</div>
          <div class="info-value">${difficultyText}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Completed at:</div>
          <div class="info-value">${formattedDate}</div>
        </div>
      </div>

      <!-- Message Box -->
      <div class="message-box">
        <p>💡 ${gradeMessage}</p>
      </div>

      <!-- Encouragement -->
      <div class="encouragement">
        <p>🌟 ${encouragementText}</p>
      </div>

      <!-- Completion Note -->
      <div class="completion-note">
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
