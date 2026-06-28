// services/adaptive/adaptiveAI.js
const { GroqService } = require('../ai/groqService');
const {
  logTokenUsage,
  generateRequestId,
  logError,
} = require('../../utils/aiLogger');
const {
  TOTAL_QUESTIONS,
  analyzeAnswerQuality,
  detectMissingConcepts,
  getNextQuestionType,
  getAdaptiveDifficulty,
  isValidAiQuestion,
  getFallbackQuestion,
  isQuestionTooSimilar,
  normalizeQuestion,
  detectProgrammingLanguage,
  detectFramework,
  MAX_DEEP_DIVE_PER_TOPIC,
  GOOD_ANSWERS_THRESHOLD,
  QUESTION_TYPES,
  getRoadmapForTopic,
  isValidConceptForLanguage,
  isValidFrameworkForLanguage,
  isQuestionValidForLanguage,
  LANGUAGE_FRAMEWORKS,
  getFallbackIdealAnswer,
  isAnswerUnknownOrTooShort,
  calculateSimilarity,
  SCORING,
} = require('./adaptiveCore');

// Initialize GroqService
const groqService = new GroqService(
  process.env.GROQ_API_KEY,
  'llama-3.3-70b-versatile',
  0.1
);

// Helper to call AI and log token usage
async function callAI(messages, feature = 'general') {
  const requestId = generateRequestId();
  const start = Date.now();
  try {
    const systemMessage = {
      role: 'system',
      content: `You are a senior technical interviewer. Provide clear, concise, and professional answers in English. Keep all code snippets, function names, class names, and technical terms in English. Focus on interview-style explanations and best practices. All responses, including questions, feedback, and explanations, must be in English.`,
    };
    let finalMessages = messages;
    if (!messages.some((m) => m.role === 'system')) {
      finalMessages = [systemMessage, ...messages];
    }
    const content = await groqService.invokeWithRetry(finalMessages);
    const duration = Date.now() - start;
    let usage = groqService.getLastUsage();
    let inputTokens = 0,
      outputTokens = 0,
      totalTokens = 0;

    if (usage && (usage.input_tokens || usage.prompt_tokens)) {
      inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
      outputTokens = usage.output_tokens || usage.completion_tokens || 0;
      totalTokens = usage.total_tokens || inputTokens + outputTokens;
    } else {
      const inputText = JSON.stringify(finalMessages);
      const outputText = content;
      inputTokens = Math.ceil(inputText.length / 4);
      outputTokens = Math.ceil(outputText.length / 4);
      totalTokens = inputTokens + outputTokens;
    }

    logTokenUsage(
      'llama-3.3-70b-versatile',
      requestId,
      inputTokens,
      outputTokens,
      totalTokens,
      feature
    );
    return content;
  } catch (err) {
    logError('llama-3.3-70b-versatile', requestId, err, feature);
    throw err;
  }
}

// Generate first question
async function generateFirstQuestion(topic, firstSubtopic) {
  const detectedLang = detectProgrammingLanguage(topic);
  const detectedFramework = detectFramework(topic);

  if (!firstSubtopic) {
    let roadmap;
    if (detectedFramework) {
      roadmap = getRoadmapForTopic(topic);
      const keys = Object.keys(roadmap.structured);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const children = roadmap.structured[firstKey];
        if (Array.isArray(children) && children.length > 0) {
          firstSubtopic = children[0];
        } else {
          firstSubtopic = firstKey;
        }
      }
    } else if (detectedLang) {
      const roadmap = getRoadmapForTopic(topic);
      const validConcepts = roadmap.flattened.filter(
        (c) =>
          isValidConceptForLanguage(c, detectedLang) &&
          isValidFrameworkForLanguage(c, detectedLang)
      );
      if (validConcepts.length > 0) {
        firstSubtopic =
          validConcepts[Math.floor(Math.random() * validConcepts.length)];
      } else {
        firstSubtopic = roadmap.flattened[0] || 'Introduction';
      }
    } else {
      const roadmap = getRoadmapForTopic(topic);
      firstSubtopic = roadmap.flattened[0] || 'Introduction';
    }
  }

  const langFrameworks = detectedLang
    ? LANGUAGE_FRAMEWORKS[detectedLang]
    : null;
  const validFrameworks = langFrameworks
    ? langFrameworks.frameworks.join(', ')
    : '';
  const invalidFrameworks = langFrameworks
    ? langFrameworks.invalid.join(', ')
    : '';

  let langHint = '';
  if (detectedLang) {
    langHint = `- The language is ${detectedLang}. ONLY ask about ${detectedLang}-specific concepts.
- ${detectedLang} frameworks include: ${validFrameworks}
- DO NOT ask about: ${invalidFrameworks}
- DO NOT mention other languages or frameworks
- Focus on ${detectedLang} features, syntax, and ecosystem`;
  } else if (detectedFramework) {
    langHint = `- The framework is ${detectedFramework}. Ask about ${detectedFramework}-specific concepts.
- Focus on ${detectedFramework} features, patterns, and best practices`;
  } else {
    langHint = `- The topic is ${topic}. Ask about ${topic} concepts.
- Keep it language-agnostic unless specified otherwise`;
  }

  const prompt = `You are a senior technical interviewer starting a ${detectedLang || topic} interview.

Topic: ${topic}
Subtopic: ${firstSubtopic}

${langHint}

CREATE A DIVERSE OPENING QUESTION:
- Ask about "${firstSubtopic}" in the context of ${topic}
- Make it engaging and thought-provoking
- Vary the question style: sometimes conceptual, sometimes practical, sometimes scenario-based
- Ask questions that probe depth of understanding
- 1-2 sentences only
- No preamble, no numbering, no markdown
- Be specific to ${detectedLang || topic}
- Natural, conversational tone
- The question must be in English.
- All text must be in English.

EXAMPLES OF GOOD QUESTIONS (for reference only, be creative):
- "How does ${firstSubtopic} work in ${detectedLang || topic} and what problems does it solve?"
- "Can you walk me through a practical implementation of ${firstSubtopic} in a ${detectedLang || topic} project?"
- "What are the key considerations when working with ${firstSubtopic} in ${detectedLang || topic}?"
- "How would you approach ${firstSubtopic} in a real-world ${detectedLang || topic} application?"

IMPORTANT CONSTRAINTS:
- DO NOT compare ${detectedLang || topic} to other languages
- DO NOT ask about concepts that don't exist in ${detectedLang || topic}
- ONLY ask about ${detectedLang || topic}-specific features
- Keep technical terms in English
- The question should be answerable with technical knowledge
- All output must be in English.

Ask the question:`;

  const response = await callAI(
    [{ role: 'user', content: prompt }],
    'first_question'
  );

  let question = (response || '').trim();

  if (detectedLang && !isQuestionValidForLanguage(question, detectedLang)) {
    question = getFallbackQuestion(firstSubtopic, 'conceptual', topic);
  }

  return isValidAiQuestion(question)
    ? question
    : getFallbackQuestion(firstSubtopic, 'conceptual', topic);
}

// ==================== SCORE QA PAIRS - WITH RICH EXPLANATIONS ====================
async function scoreQAPairs(qaPairs, topic) {
  const BATCH_SIZE = 4;
  const allScored = [];

  for (let i = 0; i < qaPairs.length; i += BATCH_SIZE) {
    const batch = qaPairs.slice(i, i + BATCH_SIZE);
    const qaText = batch
      .map((qa) => {
        const qualityNote =
          qa.answerQuality.quality === 'poor'
            ? ' [⚠️ Very short/vague]'
            : qa.answerQuality.quality === 'fair'
              ? ' [⚠️ Brief]'
              : qa.answerQuality.quality === 'good'
                ? ' [✓ Solid]'
                : ' [⭐ Detailed]';
        return `Q${qa.questionNumber} [${qa.subtopic}]: ${qa.question}\nAnswer: ${qa.answer}${qualityNote}`;
      })
      .join('\n\n');

    const userPrompt = `Topic: ${topic}

${qaText}

Return a JSON array (${batch.length} items):
[
  {
    "questionNumber": <number>,
    "score": <0-10 integer>,
    "verdict": "Excellent|Good|Adequate|Poor|Missing|OffTopic",
    "correctConcepts": ["list of concepts the candidate correctly mentioned"],
    "missingConcepts": ["list of concepts the candidate missed that are CRITICAL to the question"],
    "feedback": "Detailed feedback: (1) What was correct/good about the answer (2) What was missing or could be improved (3) Any off-topic or incorrect information (4) Specific suggestions for improvement",
    "idealAnswer": "<250-350 words, comprehensive and detailed explanation. Must include:
      - Direct answer to the question (2-3 sentences)
      - Explanation of core concepts, principles, and how they work (4-5 sentences)
      - Practical insights, trade-offs, use cases, and why it matters (3-4 sentences)
      - Comparison with related concepts if applicable (2-3 sentences)
      - Common pitfalls, best practices, or edge cases (2-3 sentences)
      - Conclusion summarizing key takeaways (1-2 sentences)
      Code examples are OPTIONAL and should only be included if the question explicitly asks for an implementation or if the concept is best illustrated with a short snippet. Prefer in-depth textual explanation over code.>",
    "idealAnswerCode": "<code snippet with comments, 5-15 lines, or null>",
    "idealAnswerCodeLanguage": "<language or null>"
  }
]

SCORING GUIDELINES (BE FAIR, NOT OVERLY HARSH):
- 0-3: Wrong or completely off-topic
- 4-6: Partially correct, missing some key points, but shows basic understanding
- 7-8: Good answer, covers most points, minor gaps
- 9-10: Excellent, comprehensive, with clear examples and depth

All text, including feedback, idealAnswer, and any description, must be in English.

Return ONLY the JSON array`;

    let batchResult = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await callAI(
          [
            {
              role: 'system',
              content: `You are a senior technical interviewer with 10+ years of experience.

Your job is to evaluate candidate answers fairly and constructively.

SCORING PRINCIPLES:
- Score based on the QUESTION ASKED, not general knowledge.
- Be fair: give credit for correct parts, identify missing points but don't over-penalize.
- A score of 7-8 means a solid answer that covers most aspects.
- Only give 9-10 for exceptional answers with depth and examples.
- Provide specific, actionable feedback.

missingConcepts should include key concepts the candidate missed that are essential to this question.

IDEAL ANSWER GUIDELINES:
- Provide a rich, detailed explanation of the concept. Aim for 250-350 words.
- Focus on explaining the 'why' and 'how', not just 'what'.
- Include trade-offs, best practices, and common pitfalls.
- Use code only when absolutely necessary to clarify the concept.

**All responses, including feedback, idealAnswer, and any text, must be in English.**

Return ONLY valid JSON.`,
            },
            { role: 'user', content: userPrompt },
          ],
          'score_qa'
        );
        const text = response
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/gi, '')
          .trim();
        const arrStart = text.indexOf('[');
        const arrEnd = text.lastIndexOf(']');
        if (arrStart === -1 || arrEnd === -1)
          throw new Error('No JSON array found');
        batchResult = JSON.parse(text.slice(arrStart, arrEnd + 1));
        break;
      } catch (err) {
        console.warn(
          `[scoreQAPairs] Batch attempt ${attempt + 1} failed: ${err.message}`
        );
      }
    }

    if (batchResult && Array.isArray(batchResult)) {
      for (const item of batchResult) {
        const qa = batch.find((q) => q.questionNumber === item.questionNumber);
        if (qa) {
          const quality = qa.answerQuality.quality;
          const maxScore = SCORING.MAX_SCORE_BY_QUALITY[quality] || 8;
          if (item.score > maxScore) {
            item.score = maxScore;
            item.feedback = `[Score capped at ${maxScore}/10 for ${quality} quality] ${item.feedback}`;
          }
          if (qa.answerQuality.tooShort && item.score > 3) {
            item.score = 3;
            item.feedback = `[Very short answer] ${item.feedback}`;
            item.verdict = 'Poor';
          }
          item.score = Math.max(0, Math.min(10, Math.round(item.score)));
        }
      }
      allScored.push(...batchResult);
    } else {
      for (const qa of batch) {
        const baseScore =
          qa.answerQuality.quality === 'poor'
            ? 1
            : qa.answerQuality.quality === 'fair'
              ? 2
              : 3;
        allScored.push({
          questionNumber: qa.questionNumber,
          score: Math.min(
            baseScore,
            SCORING.MAX_SCORE_BY_QUALITY[qa.answerQuality.quality] || 3
          ),
          verdict: 'Poor',
          correctConcepts: [],
          missingConcepts: [
            'The answer does not directly address the question asked',
            'Missing key concepts and depth',
          ],
          feedback:
            'This answer is insufficient. It either does not directly address the question, is too brief, or lacks key concepts. Please provide a more thorough and specific response.',
          idealAnswer: getFallbackIdealAnswer(qa.subtopic, topic),
          idealAnswerCode: null,
          idealAnswerCodeLanguage: null,
        });
      }
    }
  }
  return allScored;
}

// Generate next question
async function generateNextQuestion(session, answer) {
  const roadmapFlat =
    session.roadmapFlattened || getRoadmapForTopic(session.topic).flattened;

  const isUnknown = isAnswerUnknownOrTooShort(answer);
  const answerQuality = analyzeAnswerQuality(answer);

  const topicDeepCount = session.topicDeepCount || {};
  const currentTopic = session.currentSubtopic || 'default';
  const consecutiveDeepDives = topicDeepCount[currentTopic] || 0;
  const goodAnswersCount = session.goodAnswersCount || 0;

  let newConsecutiveDeepDives = consecutiveDeepDives;
  let newGoodAnswersCount = goodAnswersCount;

  if (isUnknown) {
    newConsecutiveDeepDives = 0;
    newGoodAnswersCount = 0;
  } else if (
    answerQuality.quality === 'excellent' ||
    answerQuality.quality === 'good'
  ) {
    newGoodAnswersCount = goodAnswersCount + 1;
  } else {
    newGoodAnswersCount = 0;
  }

  const questionType = getNextQuestionType(
    answerQuality,
    session.questionTypeHistory || [],
    consecutiveDeepDives,
    goodAnswersCount,
    isUnknown
  );

  const deepQuestionTypes = [
    QUESTION_TYPES.APPLICATION,
    QUESTION_TYPES.SCENARIO,
    QUESTION_TYPES.ADVANCED,
    QUESTION_TYPES.BEST_PRACTICES,
    QUESTION_TYPES.EDGE_CASES,
  ];

  const isDeepQuestion = deepQuestionTypes.includes(questionType) && !isUnknown;
  const canDeepDive = consecutiveDeepDives < MAX_DEEP_DIVE_PER_TOPIC;

  let targetSubtopic;
  let willDeepDive = false;

  const remaining = roadmapFlat.filter(
    (r) => !session.coveredTopics.includes(r)
  );

  if (isUnknown) {
    const candidates = remaining.filter((r) => r !== session.currentSubtopic);
    if (candidates.length > 0) {
      targetSubtopic =
        candidates[Math.floor(Math.random() * candidates.length)];
    } else if (remaining.length > 0) {
      targetSubtopic = remaining[Math.floor(Math.random() * remaining.length)];
    } else {
      const allOthers = roadmapFlat.filter(
        (r) => r !== session.currentSubtopic
      );
      targetSubtopic =
        allOthers.length > 0
          ? allOthers[Math.floor(Math.random() * allOthers.length)]
          : roadmapFlat[0];
    }
    willDeepDive = false;
  } else if (isDeepQuestion && canDeepDive) {
    targetSubtopic = session.currentSubtopic;
    willDeepDive = true;
  } else {
    if (remaining.length > 0) {
      targetSubtopic = remaining[Math.floor(Math.random() * remaining.length)];
    } else {
      targetSubtopic =
        roadmapFlat[Math.floor(Math.random() * roadmapFlat.length)];
    }
    willDeepDive = false;
  }

  const detectedLang = detectProgrammingLanguage(session.topic);
  const detectedFramework = detectFramework(session.topic);

  if (detectedLang) {
    if (
      !isValidConceptForLanguage(targetSubtopic, detectedLang) ||
      !isValidFrameworkForLanguage(targetSubtopic, detectedLang)
    ) {
      const validConcepts = roadmapFlat.filter(
        (c) =>
          isValidConceptForLanguage(c, detectedLang) &&
          isValidFrameworkForLanguage(c, detectedLang) &&
          c !== session.currentSubtopic
      );
      if (validConcepts.length > 0) {
        targetSubtopic =
          validConcepts[Math.floor(Math.random() * validConcepts.length)];
        willDeepDive = false;
      }
    }
  }

  session.currentSubtopic = targetSubtopic;
  if (!session.coveredTopics.includes(targetSubtopic)) {
    session.coveredTopics.push(targetSubtopic);
  }

  if (!session.topicDeepCount) session.topicDeepCount = {};
  if (willDeepDive) {
    session.topicDeepCount[currentTopic] =
      (session.topicDeepCount[currentTopic] || 0) + 1;
  } else {
    session.topicDeepCount[currentTopic] = 0;
  }
  session.goodAnswersCount = newGoodAnswersCount;

  session.questionTypeHistory = [
    ...(session.questionTypeHistory || []),
    questionType,
  ];

  const safeSub = targetSubtopic || session.topic;
  const isNewTopic = session.currentSubtopic !== session.lastSubtopic;

  let questionGuidance = '';

  if (isUnknown) {
    questionGuidance = `Ask a SIMPLE, BASIC question about "${safeSub}" in ${session.topic}.
- Start with the most fundamental concept
- Make it easy to understand
- 1 sentence only (under 30 words)
- Focus on core definition and basic understanding
- All text must be in English.`;
  } else if (isDeepQuestion && canDeepDive) {
    questionGuidance = `Ask a follow-up question about "${safeSub}" in ${session.topic}.
- Build on the previous discussion
- Focus on practical application or deeper understanding
- Be specific to ${safeSub} in ${session.topic}
- Do NOT compare to other languages
- All text must be in English.`;
  } else if (isNewTopic) {
    questionGuidance = `Ask a conceptual question about "${safeSub}" in ${session.topic}.
- Start with fundamentals of this new topic
- Focus on core concepts and understanding
- Be specific to ${safeSub} in ${session.topic}
- Do NOT compare to other languages
- All text must be in English.`;
  } else {
    questionGuidance = `Ask a question about "${safeSub}" in ${session.topic}.
- Focus on core concepts
- 1 sentence only (under 30 words)
- Do NOT compare to other languages
- All text must be in English.`;
  }

  const langFrameworks = detectedLang
    ? LANGUAGE_FRAMEWORKS[detectedLang]
    : null;
  const validFrameworks = langFrameworks
    ? langFrameworks.frameworks.join(', ')
    : '';
  const invalidFrameworks = langFrameworks
    ? langFrameworks.invalid.join(', ')
    : '';

  let extraConstraint = '';
  if (detectedFramework) {
    extraConstraint = `- ONLY ask about concepts relevant to ${detectedFramework} framework
- Do NOT mention other frameworks or languages unless necessary
- All text must be in English.`;
  } else if (detectedLang) {
    extraConstraint = `- ${detectedLang} frameworks include: ${validFrameworks}
- DO NOT ask about: ${invalidFrameworks}
- ONLY ask about ${detectedLang}-specific concepts and frameworks
- All text must be in English.`;
  }

  const prompt = `You are a senior technical interviewer.

Topic: ${session.topic}
Subtopic: ${safeSub}
Question Type: ${questionType}

${questionGuidance}

Guidelines:
- Ask 1 sentence only (under 30 words)
- No preamble, no numbering, no markdown
- Focus ONLY on ${safeSub} in ${session.topic}
- Do NOT compare to other programming languages
- Ask the question in English.
- All text must be in English.
${extraConstraint}
${isUnknown ? '- Make the question SIMPLE and BASIC' : ''}

IMPORTANT:
- If the topic is about JavaScript, DO NOT mention Spring, Django, Rails, Laravel, ASP.NET
- If the topic is about Java, DO NOT mention React, Node.js, Django, Flask, Rails
- Only ask about frameworks that belong to the specific language/framework
${isUnknown ? "- The candidate didn't know the previous answer, so ask something easier" : ''}
- Ask the question in English
- Keep technical terms and code examples in English

Do NOT repeat:
${(session.askedQuestions || []).slice(-3).join('\n') || '(none)'}

Ask the question:`;

  const response = await callAI(
    [{ role: 'user', content: prompt }],
    'next_question'
  );

  let question = (response || '').trim();

  if (detectedLang && !isQuestionValidForLanguage(question, detectedLang)) {
    question = getFallbackQuestion(
      safeSub,
      questionType,
      session.topic,
      getAdaptiveDifficulty(answerQuality)
    );
  }

  if (
    !isValidAiQuestion(question) ||
    isQuestionTooSimilar(question, session.askedQuestions, 0.6)
  ) {
    question = getFallbackQuestion(
      safeSub,
      questionType,
      session.topic,
      getAdaptiveDifficulty(answerQuality)
    );
  }

  session.askedQuestions = [
    ...(session.askedQuestions || []),
    normalizeQuestion(question),
  ];
  session.lastSubtopic = session.currentSubtopic;

  return {
    question,
    subtopic: safeSub,
    questionType,
    adaptiveDifficulty: getAdaptiveDifficulty(answerQuality),
    answerQuality: answerQuality.quality,
    isNewTopic: isNewTopic || false,
    isUnknown: isUnknown,
  };
}

// Generate final report
async function generateFinalReport(session) {
  const {
    detectMissingConcepts,
    analyzeAnswerQuality,
    buildTopicBreakdown,
  } = require('./adaptiveCore');

  const messages = session.conversation;
  const qaPairs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    const next = messages[i + 1];
    if (
      msg.role === 'assistant' &&
      msg.type === 'question' &&
      next.role === 'user' &&
      next.type === 'answer'
    ) {
      qaPairs.push({
        questionNumber: qaPairs.length + 1,
        subtopic: msg.subtopic || session.topic,
        question: msg.content,
        answer: next.content,
        answerQuality: analyzeAnswerQuality(next.content),
        ruleMissingConcepts: detectMissingConcepts(msg.subtopic, next.content),
      });
    }
  }

  const scoredItems = await scoreQAPairs(qaPairs, session.topic);

  const questionBreakdown = qaPairs.map((qa) => {
    const scored = scoredItems.find(
      (s) => s.questionNumber === qa.questionNumber
    ) || {
      score: 2,
      verdict: 'Poor',
      correctConcepts: [],
      missingConcepts: qa.ruleMissingConcepts,
      feedback: 'Could not evaluate automatically.',
      idealAnswer: '',
      idealAnswerCode: null,
      idealAnswerCodeLanguage: null,
    };

    let idealAnswer = scored.idealAnswer || '';
    if (!idealAnswer || idealAnswer.length < 100) {
      idealAnswer = getFallbackIdealAnswer(qa.subtopic, session.topic);
    }

    const mergedMissing = [
      ...new Set([
        ...(scored.missingConcepts || []),
        ...qa.ruleMissingConcepts,
      ]),
    ];

    let finalScore = scored.score;
    let feedback = scored.feedback || '';
    const quality = qa.answerQuality.quality;
    const wordCount = qa.answerQuality.wordCount || 0;

    const maxScore = SCORING.MAX_SCORE_BY_QUALITY[quality] || 8;
    if (finalScore > maxScore) {
      finalScore = maxScore;
      feedback = `[Score capped at ${maxScore}/10 for ${quality} quality] ${feedback}`;
    }

    if (wordCount < 10 && finalScore > 3) {
      finalScore = 3;
      feedback = `[Very short answer (${wordCount} words)] ${feedback}`;
    } else if (wordCount < 20 && finalScore > 5) {
      finalScore = 5;
      feedback = `[Brief answer (${wordCount} words)] ${feedback}`;
    } else if (wordCount < 30 && finalScore > 7) {
      finalScore = 7;
      feedback = `[Lacks detail (${wordCount} words)] ${feedback}`;
    }

    const missingCount = mergedMissing.length;
    if (missingCount > 4) {
      finalScore = Math.max(2, finalScore - 1);
      feedback = `[Missing ${missingCount} key concepts] ${feedback}`;
    } else if (missingCount > 2) {
      finalScore = Math.max(2, finalScore - 0.5);
      feedback = `[Missing ${missingCount} concepts] ${feedback}`;
    }

    if (quality === 'excellent' && finalScore >= 8) {
      const hasCode =
        scored.idealAnswerCode && scored.idealAnswerCode.length > 0;
      if (!hasCode) {
        feedback = `[Excellent explanation, but a code example could make it even clearer] ${feedback}`;
      } else {
        finalScore = Math.min(10, finalScore + 0.5);
      }
    }

    finalScore = Math.max(0, Math.min(10, Math.round(finalScore)));

    return {
      questionNumber: qa.questionNumber,
      subtopic: qa.subtopic,
      question: qa.question,
      score: finalScore,
      verdict: scored.verdict || 'Adequate',
      correctConcepts: scored.correctConcepts || [],
      missingConcepts: mergedMissing,
      idealAnswer: idealAnswer,
      idealAnswerCode: scored.idealAnswerCode || null,
      idealAnswerCodeLanguage: scored.idealAnswerCodeLanguage || null,
      feedback,
    };
  });

  // Attach scores to conversation
  for (const q of questionBreakdown) {
    let count = 0;
    for (let i = 0; i < session.conversation.length; i++) {
      const msg = session.conversation[i];
      if (msg.role === 'assistant' && msg.type === 'question') {
        count++;
        if (count === q.questionNumber) {
          const aIdx = i + 1;
          session.conversation[i].score = q.score;
          session.conversation[i].strengths = q.correctConcepts;
          session.conversation[i].weaknesses = q.missingConcepts;
          if (session.conversation[aIdx]?.role === 'user') {
            session.conversation[aIdx].score = q.score;
            session.conversation[aIdx].strengths = q.correctConcepts;
            session.conversation[aIdx].weaknesses = q.missingConcepts;
            session.conversation[aIdx].missingConcepts = q.missingConcepts;
          }
          break;
        }
      }
    }
  }

  const scores = questionBreakdown
    .map((q) => q.score)
    .filter((s) => typeof s === 'number');
  const avgScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 3;
  const finalScore = Math.min(10, Math.max(0, parseFloat(avgScore.toFixed(1))));

  const overallScore = Math.round(avgScore * 10);
  const grade =
    avgScore >= 8 ? 'A' : avgScore >= 6 ? 'B' : avgScore >= 4 ? 'C' : 'D';
  const overallEvaluation =
    avgScore >= 8
      ? 'Strong'
      : avgScore >= 6
        ? 'Mid-level'
        : avgScore >= 4
          ? 'Junior-ready'
          : 'Beginner';
  const hireRecommendation =
    avgScore >= 7 ? 'Yes' : avgScore >= 5 ? 'Maybe' : 'No';

  const topicBreakdown = buildTopicBreakdown(questionBreakdown);
  const summaryText = `Candidate answered ${questionBreakdown.length} questions with average score ${avgScore.toFixed(1)}/10.`;

  session.finalScore = finalScore;
  session.summary = {
    overallScore,
    grade,
    overallEvaluation,
    hireRecommendation,
    questionBreakdown,
    topicBreakdown,
    summary: summaryText,
  };

  return { report: session.summary, finalScore };
}

module.exports = {
  callAI,
  scoreQAPairs,
  generateFirstQuestion,
  generateNextQuestion,
  generateFinalReport,
};
