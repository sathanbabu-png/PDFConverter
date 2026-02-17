
import { GoogleGenAI, Type } from "@google/genai";
import { OutputFormat } from "../types";

export async function analyzeDocument(images: string[], format: OutputFormat) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const model = 'gemini-3-flash-preview';
  
  const prompt = format === OutputFormat.WORD 
    ? `Analyze the provided PDF pages. Reconstruct the document content in structured Markdown. 
       Preserve headings, paragraphs, lists, and bold text. If there are tables, represent them as Markdown tables.
       Return the output in a JSON format with a "content" field containing the Markdown text and a "title" field.`
    : `Analyze the provided PDF pages. Extract all tabular data. If there are multiple tables, consolidate them into a single logical dataset or return the most significant table.
       Return the output as a JSON object with a "tables" field (which is a 2D array of values) and a "title" field.`;

  const imageParts = images.map(img => ({
    inlineData: {
      data: img.split(',')[1],
      mimeType: 'image/jpeg'
    }
  }));

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        ...imageParts,
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: format === OutputFormat.WORD ? {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING },
          title: { type: Type.STRING }
        },
        required: ["content"]
      } : {
        type: Type.OBJECT,
        properties: {
          tables: {
            type: Type.ARRAY,
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          title: { type: Type.STRING }
        },
        required: ["tables"]
      }
    }
  });

  const text = response.text;
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response", text);
    throw new Error("Invalid response from AI");
  }
}
