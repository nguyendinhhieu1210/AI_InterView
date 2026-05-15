// pages/api/generate-questions.js
import { generateQuestionsFromCV } from '../../../backend/services/aiService';

export async function POST(req) {
  try {
    const { cvText, selectedSkills } = await req.json();
    if (!cvText || !selectedSkills) throw new Error('Missing data');
    const questions = await generateQuestionsFromCV(selectedSkills, cvText);
    return Response.json(questions);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}