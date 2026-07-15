import { Router } from "express";
import { GoogleGenAI, Type } from "@google/genai";

export const ocrRouter = Router();

ocrRouter.post("/", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } },
          { text: "Extract information from this image (business card, notes, etc.) into the provided JSON structure. Try to extract as much relevant information as possible for an HCP interaction." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hcpName: { type: Type.STRING },
            hcpSpecialty: { type: Type.STRING },
            hcpLocation: { type: Type.STRING },
            topicsDiscussed: { type: Type.STRING },
            interactionType: { type: Type.STRING },
          }
        }
      }
    });

    const text = response.text;
    res.json(JSON.parse(text || "{}"));
  } catch (error: any) {
    console.error("OCR error:", error);
    res.status(500).json({ error: error.message });
  }
});
