const fs = require('fs');
const mammoth = require('mammoth');

const CVInterviewSession =
  require('../models/CVInterviewSession');

const { analyzeCVSkills } =
  require('../services/cv/analyzeSkills');

const { generateQuestionsFromCV } =
  require('../services/interview/generateQuestions');

const { gradeCVAnswersAdvanced } =
  require('../services/interview/gradingService');

const { extractTextFromPDF } =
  require('../utils/pdfReader');


const saveActivity = require('../utils/saveActivity');

/**
 * Extract text from uploaded file
 */
const extractTextFromFile = async (
  filePath,
  mimetype
) => {

  // PDF
  if (mimetype === 'application/pdf') {
    return await extractTextFromPDF(filePath);
  }

  // DOCX
  if (
    mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {

    const result =
      await mammoth.extractRawText({
        path: filePath
      });

    return result.value;
  }

  throw new Error('Unsupported file type');
};

/**
 * Upload CV file
 */
exports.uploadCV = async (req, res) => {

  try {

    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    console.log('=== UPLOAD CV ===');

    console.log(
      'File:',
      file.originalname,
      'Type:',
      file.mimetype
    );

    // Extract text
    let text =
      await extractTextFromFile(
        file.path,
        file.mimetype
      );

    text = text
      .replace(/\s+/g, ' ')
      .trim();

    console.log(
      'Extracted text length:',
      text.length
    );

    // Analyze CV
    const analyzed =
      await analyzeCVSkills(text);

    const {
      fullName,
      skills
    } = analyzed;

    console.log(
      'Analyzed result:',
      JSON.stringify(
        { fullName, skills },
        null,
        2
      )
    );

    // Delete uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return res.json({
      success: true,
      fullName,
      skills,
      rawText: text,
      fileName: file.originalname
    });

  } catch (error) {

    console.error(
      'Upload CV error:',
      error
    );

    // Cleanup file if exists
    if (
      req.file &&
      req.file.path &&
      fs.existsSync(req.file.path)
    ) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error(
          'Delete file error:',
          e.message
        );
      }
    }

    return res.status(500).json({
      error: 'Failed to process CV'
    });
  }
};

/**
 * Analyze CV text directly
 */
exports.analyzeCVText = async (
  req,
  res
) => {

  try {

    let { cvText } = req.body;

    if (!cvText) {
      return res.status(400).json({
        error: 'Missing cvText'
      });
    }

    cvText = cvText
      .replace(/\s+/g, ' ')
      .trim();

    console.log(
      '=== ANALYZE CV TEXT ==='
    );

    const result =
      await analyzeCVSkills(cvText);

    return res.json(result);

  } catch (err) {

    console.error(
      'analyzeCVText error:',
      err
    );

    return res.status(500).json({
      error: err.message
    });
  }
};

/**
 * Generate interview questions
 */
exports.generateQuestionsFromText =
  async (req, res) => {

    try {

      const {
        cvText,
        selectedSkills
      } = req.body;

      if (
        !cvText ||
        !selectedSkills
      ) {

        return res.status(400).json({
          error: 'Missing data'
        });
      }

      const questions =
        await generateQuestionsFromCV(
          selectedSkills,
          cvText
        );

      return res.json({
        success: true,
        questions
      });

    } catch (error) {

      console.error(
        'Generate questions error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to generate questions'
      });
    }
  };

/**
 * Submit interview answers
 */
exports.submitCVAnswers = async (req, res) => {
  try {
    const {
      questions,
      answers,
      selectedSkills,
      cvName
    } = req.body;

    if (!questions || !answers) {
      return res.status(400).json({
        error: 'Missing questions or answers'
      });
    }

    const results = await gradeCVAnswersAdvanced(
      questions,
      answers
    );

    let session;

    // Save history if logged in
    if (req.user?.id) {

      const combinedResults = [
        ...(results.mcq || []),
        ...(results.text || [])
      ];

      session = new CVInterviewSession({
        userId: req.user.id,
        cvName: cvName || '',
        topic: selectedSkills || [],
        questions,
        answers,
        results: combinedResults,
        totalScore: results.totalScore,
        summary: results.summary
      });

      await session.save();

      // ✅ FIXED: save activity đúng chuẩn
      await saveActivity(req.user.id, 'cv_interview');
    }

    return res.json({
      success: true,
      results: {
        mcq: results.mcq,
        text: results.text,
        totalScore: results.totalScore,
        summary: results.summary
      }
    });

  } catch (error) {
    console.error('Submit CV answers error:', error);

    return res.status(500).json({
      error: 'Failed to grade answers'
    });
  }
};

/**
 * Get all CV interview history
 */
exports.getCVSessionHistory =
  async (req, res) => {

    try {

      if (
        !req.user ||
        !req.user.id
      ) {

        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const sessions =
        await CVInterviewSession
          .find({
            userId: req.user.id
          })
          .sort({
            createdAt: -1
          });

      return res.json({
        success: true,
        history: sessions
      });

    } catch (error) {

      console.error(
        'Get CV session history error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to fetch CV history'
      });
    }
  };

/**
 * Get CV interview detail
 */
exports.getCVSessionDetail =
  async (req, res) => {

    try {

      const sessionId =
        req.params.id;

      if (
        !req.user ||
        !req.user.id
      ) {

        return res.status(401).json({
          error: 'Unauthorized'
        });
      }

      const session =
        await CVInterviewSession.findOne({
          _id: sessionId,
          userId: req.user.id
        });

      if (!session) {

        return res.status(404).json({
          success: false,
          message:
            'CV session not found'
        });
      }

      return res.json({
        success: true,
        history: session
      });

    } catch (error) {

      console.error(
        'Get CV session detail error:',
        error
      );

      return res.status(500).json({
        error:
          'Failed to fetch CV session detail'
      });
    }
  };