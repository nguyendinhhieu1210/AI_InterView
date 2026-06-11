// interviewTemplate.js - Complete fixed version with Enhanced Layout
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e9edf2 100%);
      line-height: 1.5;
      padding: 2rem 1rem;
      min-height: 100vh;
    }

    /* Main Card Container */
    .result-container {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 2rem;
      overflow: hidden;
      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease;
    }

    /* Header Section */
    .result-header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 2rem 2rem 1.8rem;
      text-align: center;
      color: white;
      position: relative;
    }
    
    .result-header h1 {
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    
    .result-header p {
      opacity: 0.85;
      font-size: 0.9rem;
    }

    /* Content Area */
    .result-content {
      padding: 2rem;
    }

    /* Greeting Section */
    .greeting-section {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f1f5f9;
    }
    
    .greeting-section h2 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    
    .topic-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8fafc;
      padding: 0.4rem 1rem;
      border-radius: 2rem;
      font-size: 0.85rem;
      font-weight: 500;
      color: #334155;
      margin-top: 0.75rem;
    }

    /* Total Score Card */
    .total-score-card {
      background: linear-gradient(135deg, ${gradeColor}08 0%, ${gradeColor}03 100%);
      border-radius: 1.5rem;
      padding: 1.8rem;
      text-align: center;
      margin-bottom: 2rem;
      border: 1px solid ${gradeColor}20;
    }
    
    .score-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 0.75rem;
    }
    
    .main-score {
      font-size: 4rem;
      font-weight: 800;
      color: ${gradeColor};
      line-height: 1;
      margin-bottom: 0.5rem;
    }
    
    .main-score span {
      font-size: 1.5rem;
      font-weight: 500;
      color: #94a3b8;
    }
    
    .grade-badge {
      display: inline-block;
      background: ${gradeColor};
      color: white;
      padding: 0.3rem 1.2rem;
      border-radius: 2rem;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Two Column Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: #f8fafc;
      border-radius: 1.5rem;
      padding: 1.5rem;
      transition: all 0.2s;
    }
    
    .stat-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .stat-icon {
      font-size: 1.8rem;
    }
    
    .stat-title {
      font-weight: 700;
      color: #1e293b;
    }
    
    .stat-score {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }
    
    .stat-score small {
      font-size: 0.9rem;
      font-weight: 500;
      color: #64748b;
    }
    
    .progress-bar-container {
      background: #e2e8f0;
      border-radius: 1rem;
      height: 0.5rem;
      overflow: hidden;
      margin: 0.75rem 0 0.5rem;
    }
    
    .progress-fill {
      background: ${gradeColor};
      height: 100%;
      border-radius: 1rem;
      width: 0%;
      transition: width 0.3s ease;
    }
    
    .percent-text {
      font-size: 0.75rem;
      color: #64748b;
      text-align: right;
      font-weight: 500;
    }

    /* Interview Details Panel */
    .details-panel {
      background: #ffffff;
      border-radius: 1.5rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid #eef2ff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    }
    
    .details-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.2rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .detail-row {
      display: flex;
      padding: 0.6rem 0;
      border-bottom: 1px solid #f8fafc;
    }
    
    .detail-label {
      min-width: 7rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
    }
    
    .detail-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: #0f172a;
    }

    /* Feedback Messages */
    .feedback-box {
      background: ${gradeColor}08;
      border-left: 4px solid ${gradeColor};
      border-radius: 1rem;
      padding: 1rem 1.5rem;
      margin-bottom: 1rem;
    }
    
    .feedback-box p {
      color: ${gradeColor === "#f59e0b" ? "#b45309" : gradeColor === "#f97316" ? "#c2410c" : gradeColor};
      font-weight: 500;
      font-size: 0.9rem;
    }
    
    .encouragement-box {
      background: #fef9e3;
      border-radius: 1rem;
      padding: 1rem 1.5rem;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .encouragement-box p {
      color: #d97706;
      font-weight: 500;
      font-size: 0.9rem;
    }
    
    .completion-box {
      background: #f0fdf4;
      border-radius: 1rem;
      padding: 0.8rem;
      text-align: center;
    }
    
    .completion-box p {
      color: #166534;
      font-size: 0.85rem;
      font-weight: 500;
    }

    /* Footer */
    .result-footer {
      background: #fafcff;
      padding: 1.5rem;
      text-align: center;
      border-top: 1px solid #eef2ff;
    }
    
    .result-footer p {
      color: #94a3b8;
      font-size: 0.7rem;
      margin: 0.25rem 0;
    }

    /* Responsive Design */
    @media (max-width: 560px) {
      body {
        padding: 1rem;
      }
      .result-content {
        padding: 1.5rem;
      }
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      .main-score {
        font-size: 3rem;
      }
      .detail-row {
        flex-direction: column;
        gap: 0.25rem;
      }
      .detail-label {
        min-width: auto;
      }
      .greeting-section h2 {
        font-size: 1.4rem;
      }
    }
  </style>
</head>
<body>
  <div class="result-container">
    <!-- Header -->
    <div class="result-header">
      <h1>📊 INTERVIEW RESULT</h1>
      <p>Your performance assessment</p>
    </div>

    <!-- Content -->
    <div class="result-content">
      <!-- Greeting -->
      <div class="greeting-section">
        <h2>Hello ${userName}! 👋</h2>
        <div class="topic-badge">
          <span>📌</span> Completed interview on <strong>“${topic}”</strong> · Difficulty: ${difficultyText}
        </div>
      </div>

      <!-- Total Score Card -->
      <div class="total-score-card">
        <div class="score-label">Total Score</div>
        <div class="main-score">${totalScore}<span>/100</span></div>
        <div class="grade-badge">🏆 ${gradeText}</div>
      </div>

      <!-- MCQ & Essay Grid -->
      <div class="stats-grid">
        <!-- MCQ Section -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">📝</span>
            <span class="stat-title">Multiple Choice</span>
          </div>
          <div class="stat-score">${mcqScore}<small>/70</small></div>
          <div class="progress-bar-container">
            <div class="progress-fill" style="width: ${mcqPercent}%"></div>
          </div>
          <div class="percent-text">${Math.round(mcqPercent)}% achieved</div>
        </div>

        <!-- Essay Section -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">✍️</span>
            <span class="stat-title">Essay Questions</span>
          </div>
          <div class="stat-score">${essayScore}<small>/30</small></div>
          <div class="progress-bar-container">
            <div class="progress-fill" style="width: ${essayPercent}%"></div>
          </div>
          <div class="percent-text">${Math.round(essayPercent)}% achieved</div>
        </div>
      </div>

      <!-- Interview Details -->
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

      <!-- Dynamic Messages -->
      <div class="feedback-box">
        <p>💡 ${gradeMessage}</p>
      </div>

      <div class="encouragement-box">
        <p>🌟 ${encouragementText}</p>
      </div>

      <div class="completion-box">
        <p>✅ You have successfully completed this interview</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="result-footer">
      <p>© 2026 AI Interview System | Powered by Artificial Intelligence</p>
      <p>This email was sent automatically, please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { getInterviewTemplate };
