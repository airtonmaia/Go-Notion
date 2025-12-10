import { GoogleGenAI } from "@google/genai";

// Initialize the client
// IMPORTANT: process.env.API_KEY is handled by the environment and must not be hardcoded or requested from user UI.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const summarizeText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Please summarize the following text concisely in Portuguese (Brazilian). Use bullet points if applicable:\n\n${text}`,
      config: {
        systemInstruction: "You are a helpful editorial assistant specialized in summarizing notes.",
        temperature: 0.3,
      }
    });
    return response.text || "Não foi possível gerar um resumo.";
  } catch (error) {
    console.error("Error summarizing text:", error);
    throw new Error("Falha ao conectar com Gemini AI.");
  }
};

export const fixGrammarAndStyle = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Please rewrite the following text to improve grammar, clarity, and flow, maintaining the original meaning. Respond in Portuguese (Brazilian):\n\n${text}`,
      config: {
        systemInstruction: "You are a professional editor. Do not add conversational filler. Just output the corrected text.",
        temperature: 0.2,
      }
    });
    return response.text || text;
  } catch (error) {
    console.error("Error fixing grammar:", error);
    throw new Error("Falha ao processar texto.");
  }
};

export const continueWriting = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Continue writing the following text naturally. Maintain the tone and language (Portuguese). Add about 1-2 paragraphs:\n\n${text}`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Error continuing text:", error);
    throw new Error("Falha ao gerar texto.");
  }
};

export const generateIdeas = async (title: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `I have a note titled "${title}". Please suggest an outline or 5 key points I should cover in this note. Portuguese (Brazilian).`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating ideas:", error);
    throw new Error("Falha ao gerar ideias.");
  }
};
