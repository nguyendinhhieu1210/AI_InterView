// pages/api/analyze-cv.js
import { analyzeCVSkills } from '../../backend/services/aiService';  // ← đúng relative path

export async function POST(req) {
  try {
    const { cvText } = await req.json();
    if (!cvText) return new Response(JSON.stringify({ error: 'Missing cvText' }), { status: 400 });
    const result = await analyzeCVSkills(cvText);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}