import { GoogleGenAI } from '@google/genai';
import { AlgorithmType, SortStats } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export async function explainAlgorithm(algo: AlgorithmType, arraySize: number) {
  try {
    const ai = getClient();
    const prompt = `
      You are an expert Computer Science professor.
      Explain the ${algo} algorithm concisely.
      
      Structure:
      1. Brief concept (1-2 sentences).
      2. Time Complexity (Best, Average, Worst).
      3. Space Complexity.
      4. Is it stable?
      5. Why is it good or bad for a dataset of size ${arraySize}?
      
      Format your response as markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error fetching explanation. Please ensure API Key is set.";
  }
}

export async function analyzePerformance(stats: SortStats[]) {
  try {
    const ai = getClient();
    const statsStr = JSON.stringify(stats);
    const prompt = `
      Analyze these sorting algorithm performance statistics:
      ${statsStr}
      
      Which algorithm performed best and why? 
      Are there any surprises given the O(n) complexities?
      Provide a concise summary recommendation.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error analyzing performance.";
  }
}
