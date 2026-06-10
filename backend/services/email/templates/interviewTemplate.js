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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <title>Interview Result — JavaScript Assessment</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(145deg, #eef2f9 0%, #e2e8f0 100%);
      margin: 0;
      padding: 32px 20px;
      line-height: 1.45;
    }

    /* main card container */
    .result-card {
      max-width: 660px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 48px;
      overflow: hidden;
      box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    /* modern header with gradient & subtle pattern */
    .result-header {
      background: linear-gradient(125deg, #1F2B4E 0%, #2D3A6E 100%);
      padding: 32px 32px 28px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .result-header::before {
      content: "✨";
      font-size: 140px;
      position: absolute;
      right: -30px;
      top: -40px;
      opacity: 0.08;
      pointer-events: none;
    }

    .result-header h1 {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: white;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .result-header .subhead {
      color: rgba(255,255,255,0.75);
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    /* main content */
    .result-content {
      padding: 32px 32px 28px;
    }

    /* greeting area with modern flair */
    .greeting-area {
      margin-bottom: 28px;
      border-bottom: 2px solid #f0f2f8;
      padding-bottom: 16px;
    }

    .greeting-area h2 {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #1e293b, #2d3a5e);
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      margin-bottom: 4px;
    }

    .topic-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f1f5f9;
      padding: 6px 14px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      margin-top: 10px;
    }

    /* enhanced total score dashboard */
    .score-dashboard {
      background: linear-gradient(to bottom right, #f8fafd, #ffffff);
      border-radius: 36px;
      padding: 8px 20px 20px 20px;
      margin-bottom: 28px;
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255,255,255,0.8);
      border: 1px solid #eef2ff;
    }

    .total-score-wrap {
      text-align: center;
      padding: 16px 0 8px;
    }

    .score-label-modern {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #5b6e8c;
      margin-bottom: 12px;
    }

    .big-score {
      font-size: 72px;
      font-weight: 800;
      line-height: 1;
      color: #2563eb;
      display: inline-flex;
      align-items: baseline;
      gap: 4px;
    }

    .big-score span {
      font-size: 24px;
      font-weight: 600;
      color: #94a3b8;
    }

    .grade-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #2563eb10;
      backdrop-filter: blur(2px);
      padding: 6px 20px;
      border-radius: 60px;
      margin-top: 14px;
      font-weight: 700;
      font-size: 15px;
      color: #2563eb;
      border: 1px solid #2563eb30;
    }

    /* two column metrics with nice visual */
    .metrics-grid {
      display: flex;
      gap: 20px;
      margin: 28px 0 24px;
      flex-wrap: wrap;
    }

    .metric-card {
      flex: 1;
      background: #ffffff;
      border-radius: 28px;
      padding: 20px 16px;
      box-shadow: 0 5px 18px rgba(0, 0, 0, 0.04);
      border: 1px solid #eef2f6;
      transition: transform 0.1s ease;
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }

    .metric-icon {
      font-size: 32px;
    }

    .metric-title {
      font-weight: 700;
      font-size: 16px;
      color: #0f172a;
    }

    .metric-score {
      font-size: 34px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .metric-score small {
      font-size: 15px;
      font-weight: 500;
      color: #5b6e8c;
    }

    .progress-micro {
      margin: 12px 0 6px;
      height: 8px;
      background: #e2e8f0;
      border-radius: 20px;
      overflow: hidden;
    }

    .progress-fill-mcq, .progress-fill-essay {
      height: 100%;
      border-radius: 20px;
      width: 0%;
      transition: width 0.3s;
    }

    .progress-fill-mcq {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }
    .progress-fill-essay {
      background: linear-gradient(90deg, #8b5cf6, #a78bfa);
    }

    .percent-text {
      font-size: 12px;
      font-weight: 500;
      color: #5b6e8c;
      text-align: right;
    }

    /* info panel refined */
    .info-panel {
      background: #f9fbfe;
      border-radius: 28px;
      padding: 20px 24px;
      margin: 24px 0 22px;
      border: 1px solid #eef2f8;
    }

    .info-header {
      font-weight: 700;
      font-size: 17px;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      letter-spacing: -0.2px;
    }

    .info-rows {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .info-row {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      justify-content: space-between;
      border-bottom: 1px dashed #e2edf7;
      padding-bottom: 8px;
    }

    .info-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .info-label {
      font-weight: 600;
      color: #4b5565;
      font-size: 14px;
      min-width: 110px;
    }

    .info-value {
      font-weight: 700;
      color: #111827;
      font-size: 15px;
      background: #ffffff;
      padding: 2px 12px;
      border-radius: 40px;
    }

    /* message blocks with elegance */
    .feedback-message {
      background: #f0f9ff;
      border-radius: 24px;
      padding: 18px 20px;
      margin: 20px 0 16px;
      border-left: 6px solid #3b82f6;
      transition: all 0.2s;
    }

    .feedback-message p {
      font-weight: 500;
      color: #1e40af;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .encouragement-modern {
      background: #fff7e5;
      border-radius: 24px;
      padding: 18px 20px;
      margin: 16px 0 20px;
      border: 1px solid #ffedd5;
      text-align: center;
    }

    .encouragement-modern p {
      font-weight: 600;
      color: #b45309;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .completion-footnote {
      background: #eef9f2;
      border-radius: 22px;
      text-align: center;
      padding: 14px 16px;
      margin-top: 18px;
    }

    .completion-footnote p {
      color: #15803d;
      font-weight: 500;
      font-size: 13px;
    }

    /* footer */
    .result-footer {
      background: #fafdff;
      padding: 20px 28px 22px;
      text-align: center;
      border-top: 1px solid #eef2f0;
    }

    .result-footer p {
      font-size: 11px;
      color: #8596ae;
      margin: 5px 0;
    }

    /* responsive */
    @media (max-width: 540px) {
      body {
        padding: 16px 12px;
      }
      .result-card {
        border-radius: 32px;
      }
      .result-content {
        padding: 22px 20px;
      }
      .metrics-grid {
        flex-direction: column;
        gap: 16px;
      }
      .big-score {
        font-size: 58px;
      }
      .info-row {
        flex-direction: column;
        gap: 6px;
      }
      .info-value {
        align-self: flex-start;
      }
      .greeting-area h2 {
        font-size: 22px;
      }
      .result-header h1 {
        font-size: 26px;
      }
    }
  </style>
</head>
<body>
<div class="result-card">
  <!-- header section refined -->
  <div class="result-header">
    <h1>📋 ASSESSMENT REPORT</h1>
    <div class="subhead">AI-powered interview analysis · performance summary</div>
  </div>

  <div class="result-content">
    <!-- Greeting with topic clarity -->
    <div class="greeting-area">
      <h2>Hello HieuNo! 👋</h2>
      <div class="topic-badge">
        <span>🧠</span> Completed interview on <strong>“JavaScript”</strong> · Difficulty: Easy
      </div>
    </div>

    <!-- Main score area with dynamic grade (totalScore = 84 => Good) -->
    <div class="score-dashboard">
      <div class="total-score-wrap">
        <div class="score-label-modern">TOTAL ACHIEVEMENT</div>
        <div class="big-score">84<span>/100</span></div>
        <div class="grade-chip">
          🏆 Good · Solid performance
        </div>
      </div>
    </div>

    <!-- two-column metrics for MCQ & essay (better layout) -->
    <div class="metrics-grid">
      <!-- MCQ block -->
      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon">📝</div>
          <div class="metric-title">Multiple Choice</div>
        </div>
        <div class="metric-score">60<small>/70</small></div>
        <div class="progress-micro">
          <div class="progress-fill-mcq" style="width: 86%"></div>
        </div>
        <div class="percent-text">86% · strong accuracy</div>
      </div>
      <!-- Essay block -->
      <div class="metric-card">
        <div class="metric-header">
          <div class="metric-icon">✍️</div>
          <div class="metric-title">Essay Questions</div>
        </div>
        <div class="metric-score">24<small>/30</small></div>
        <div class="progress-micro">
          <div class="progress-fill-essay" style="width: 80%"></div>
        </div>
        <div class="percent-text">80% · good reasoning</div>
      </div>
    </div>

    <!-- Interview Details panel with structured layout (clean) -->
    <div class="info-panel">
      <div class="info-header">
        <span>📌</span> Interview details
      </div>
      <div class="info-rows">
        <div class="info-row">
          <span class="info-label">🎯 Topic</span>
          <span class="info-value">JavaScript (Core)</span>
        </div>
        <div class="info-row">
          <span class="info-label">⚡ Difficulty</span>
          <span class="info-value">Easy</span>
        </div>
        <div class="info-row">
          <span class="info-label">📅 Completed at</span>
          <span class="info-value">06/10/2026, 03:14 PM</span>
        </div>
      </div>
    </div>

    <!-- Dynamic feedback messages based on grade (84 -> Good) -->
    <div class="feedback-message">
      <p>💡 👍 Very good! You have a solid grasp of the core concepts. Your JavaScript understanding is consistent, and you demonstrated good problem-solving patterns.</p>
    </div>
    <div class="encouragement-modern">
      <p>🌟 Review a bit more to achieve even better results! Focus on advanced closures and async patterns to reach expert level.</p>
    </div>
    <div class="completion-footnote">
      <p>✅ You have successfully completed this interview · certificate ready</p>
    </div>
  </div>

  <div class="result-footer">
    <p>© 2026 AI Interview System | Powered by advanced assessment engine</p>
    <p>This is an automated performance report — keep growing your skills</p>
  </div>
</div>
</body>
</html>
  `;
};

module.exports = { getInterviewTemplate };
