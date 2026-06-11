// cvInterviewTemplate.js - Simplified version
const getCvInterviewTemplate = (userName, interviewData) => {
  const { cvName, topic, totalScore, results } = interviewData;

  // SAFE FIX: Check if results exist and is array
  const safeResults = Array.isArray(results) ? results : [];

  // Tách MCQ và Essay từ results
  const mcqResults = safeResults.filter(
    (r) => r.type === "mcq" || r.isCorrect !== undefined,
  );
  const essayResults = safeResults.filter(
    (r) =>
      r.type === "text" || (r.score !== undefined && r.isCorrect === undefined),
  );

  // Tính điểm từng phần
  const mcqScore = mcqResults.reduce((sum, r) => sum + (r.score || 0), 0);
  const essayScore = essayResults.reduce((sum, r) => sum + (r.score || 0), 0);

  // Calculate max possible scores
  const maxMcqScore = mcqResults.length * 10;
  const maxEssayScore = essayResults.length * 10;

  // Check if we have MCQ or Essay questions
  const hasMcqQuestions = mcqResults.length > 0;
  const hasEssayQuestions = essayResults.length > 0;

  // Lấy danh sách kỹ năng từ topic (đây là skills của user từ CV)
  const skillsList = Array.isArray(topic) ? topic : topic ? [topic] : [];

  // Format skills for display - join with commas
  const skillsDisplay = skillsList.join(", ");

  // Log for debugging
  console.log("[CV Template] User skills:", skillsList);
  console.log("[CV Template] Results breakdown:", {
    totalResults: safeResults.length,
    mcqCount: mcqResults.length,
    essayCount: essayResults.length,
    mcqScore: mcqScore,
    essayScore: essayScore,
    totalScore: totalScore,
  });

  // Determine grade and personalized messages based on total score
  let gradeText = "";
  let gradeColor = "";
  let gradeMessage = "";

  if (totalScore >= 85) {
    gradeText = "Excellent";
    gradeColor = "#10b981";
    gradeMessage = `🎉 Excellent! You have demonstrated outstanding knowledge of ${skillsDisplay}. Your expertise is truly impressive. Keep up the great work!`;
  } else if (totalScore >= 70) {
    gradeText = "Good";
    gradeColor = "#3b82f6";
    gradeMessage = `👍 Good job! You have a solid grasp of ${skillsDisplay}. Review a bit more to achieve excellent results!`;
  } else if (totalScore >= 50) {
    gradeText = "Fair";
    gradeColor = "#f59e0b";
    gradeMessage = `📚 Fair performance! You understand the basics of ${skillsDisplay}, but need to deepen your knowledge. Keep practicing and you'll improve!`;
  } else if (totalScore >= 30) {
    gradeText = "Average";
    gradeColor = "#f97316";
    gradeMessage = `💪 Keep trying! You need to review ${skillsDisplay} more thoroughly. Focus on understanding the core concepts. Don't give up!`;
  } else {
    gradeText = "Needs Improvement";
    gradeColor = "#ef4444";
    gradeMessage = `📖 Needs improvement. You should study ${skillsDisplay} more carefully. Start with the fundamentals and try the interview again. Success will come!`;
  }

  // Format date
  const formattedDate = new Date().toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV Interview Result - ${cvName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
    /* CV Info */
    .cv-info {
      background: #f8fafc;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .cv-row {
      display: flex;
      align-items: baseline;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .cv-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .cv-label {
      min-width: 80px;
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
    }
    .cv-value {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      flex: 1;
    }
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }
    .skill-tag {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      color: #5b46b9;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .skill-tag:hover {
      transform: translateY(-1px);
      background: linear-gradient(135deg, #667eea25 0%, #764ba225 100%);
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
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }
    .stats-grid.two-cols {
      grid-template-columns: 1fr 1fr;
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
    }
    .stat-percent {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
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
      color: ${gradeColor === "#f59e0b" ? "#b45309" : gradeColor};
      font-size: 14px;
      font-weight: 500;
      line-height: 1.5;
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
      .stats-grid.two-cols {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .score-value {
        font-size: 44px;
      }
      .stat-score {
        font-size: 24px;
      }
      .cv-row {
        flex-direction: column;
        gap: 6px;
      }
      .cv-label {
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📄 CV INTERVIEW RESULT</h1>
      <p>Your performance assessment based on your CV</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">
        <h2>Hello ${userName}!</h2>
        <p>You've completed the CV-based interview</p>
      </div>

      <!-- CV Information -->
      <div class="cv-info">
        <div class="cv-row">
          <div class="cv-label">📄 CV:</div>
          <div class="cv-value">${cvName}</div>
        </div>
        ${
          skillsList.length > 0
            ? `
        <div class="cv-row">
          <div class="cv-label">🎯 Skills:</div>
          <div class="cv-value">
            <div class="skills-list">
              ${skillsList.map((skill) => `<span class="skill-tag">${skill}</span>`).join("")}
            </div>
          </div>
        </div>
        `
            : ""
        }
      </div>

      <!-- Total Score Card -->
      <div class="score-card">
        <div class="score-label">Total Score</div>
        <div class="score-value">${totalScore}<span class="score-max">/100</span></div>
        <div class="grade-badge">🏆 ${gradeText}</div>
      </div>

      <!-- Stats Grid: Show MCQ and Essay ONLY if they have questions -->
      <div class="stats-grid ${hasMcqQuestions && hasEssayQuestions ? "two-cols" : ""}">
        ${
          hasMcqQuestions
            ? `
        <!-- MCQ Card -->
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-label">Multiple Choice</div>
          <div class="stat-score">${mcqScore}<span class="stat-max">/${maxMcqScore}</span></div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${maxMcqScore > 0 ? (mcqScore / maxMcqScore) * 100 : 0}%"></div>
          </div>
          <div class="stat-percent">${maxMcqScore > 0 ? Math.round((mcqScore / maxMcqScore) * 100) : 0}% achieved</div>
        </div>
        `
            : ""
        }
        
        ${
          hasEssayQuestions
            ? `
        <!-- Essay Card -->
        <div class="stat-card">
          <div class="stat-icon">✍️</div>
          <div class="stat-label">Essay Questions</div>
          <div class="stat-score">${essayScore}<span class="stat-max">/${maxEssayScore}</span></div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${maxEssayScore > 0 ? (essayScore / maxEssayScore) * 100 : 0}%"></div>
          </div>
          <div class="stat-percent">${maxEssayScore > 0 ? Math.round((essayScore / maxEssayScore) * 100) : 0}% achieved</div>
        </div>
        `
            : ""
        }
      </div>

      <!-- Personalized Evaluation Message with skills -->
      <div class="message-box">
        <p>💡 ${gradeMessage}</p>
      </div>

      <!-- Completion Note -->
      <div class="completion-note">
        <p>✅ You have successfully completed this CV-based interview</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© 2026 AI Interview System | CV-based Assessment</p>
      <p>This email was sent automatically, please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { getCvInterviewTemplate };
