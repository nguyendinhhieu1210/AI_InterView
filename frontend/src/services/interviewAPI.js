import api from './api';

export const generateQuestions = async (topic, difficulty) => {
  const response = await api.post('/interview/generate', { topic, difficulty });
  return response.data.questions;
};

export const submitAnswers = async (sessionId, answers) => {
  const response = await api.post('/interview/submit', { sessionId, answers });
  return response.data;
};