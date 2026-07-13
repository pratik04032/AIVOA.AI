import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
new ChatGoogleGenerativeAI({
  model: "gemini-3.1-pro-preview",
  thinkingConfig: { thinkingLevel: "HIGH" }
});
