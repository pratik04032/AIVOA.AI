import { Router } from "express";
import { agent } from "./agent/index.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";

export const chatRouter = Router();

chatRouter.post("/summarize", async (req, res) => {
  try {
    const { formState } = req.body;
    const llm = new ChatGroq({
      model: "llama-3.1-8b-instant",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.2,
    });

    const prompt = `You are an AI assistant helping a life science field representative.
Summarize the following interaction details into a brief, professional bulleted list.
Focus on key takeaways, sentiments, and follow-ups. Keep it very concise.

Interaction Data:
${JSON.stringify(formState, null, 2)}`;

    const response = await llm.invoke([new HumanMessage({ content: prompt })]);
    res.json({ summary: response.content });
  } catch (error: any) {
    console.error("Summarize error:", error);
    res.status(500).json({ error: error.message });
  }
});

chatRouter.post("/summarize-sentence", async (req, res) => {
  try {
    const { formState } = req.body;
    const llm = new ChatGroq({
      model: "llama-3.1-8b-instant",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.2,
    });

    const prompt = `You are an AI assistant helping a life science field representative.
Generate a concise, single-sentence summary of the current interaction based on the following data.
Do not use bullet points or extra text. Just a single, complete sentence.

Interaction Data:
${JSON.stringify(formState, null, 2)}`;

    const response = await llm.invoke([new HumanMessage({ content: prompt })]);
    res.json({ summary: response.content });
  } catch (error: any) {
    console.error("Summarize sentence error:", error);
    res.status(500).json({ error: error.message });
  }
});

chatRouter.post("/analyze-sentiment", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.json({ sentiment: 'Neutral' });
    }
    const llm = new ChatGroq({
      model: "llama-3.1-8b-instant",
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.1,
    });

    const prompt = `Analyze the sentiment of the following interaction notes from a healthcare professional meeting.
Return ONLY one of the following words: Positive, Neutral, or Negative. Do not include any punctuation or extra text.

Notes:
"${text}"`;

    const response = await llm.invoke([new HumanMessage({ content: prompt })]);
    let sentiment = response.content.toString().trim().replace(/[^a-zA-Z]/g, '');
    if (!['Positive', 'Neutral', 'Negative'].includes(sentiment)) {
      sentiment = 'Neutral'; // fallback
    }
    res.json({ sentiment });
  } catch (error: any) {
    console.error("Sentiment analysis error:", error);
    res.status(500).json({ error: error.message });
  }
});

chatRouter.post("/", async (req, res) => {
  try {
    const { messages, formState } = req.body;
    
    // Construct LangChain messages
    const lcMessages: any[] = [
      new SystemMessage({
        content: "You are an AI assistant helping a life science field representative log interactions with Healthcare Professionals (HCPs).\n" +
        "You can use the provided tools to extract interaction data from the user's natural language input.\n" +
        "When the user wants to log an interaction, use the log_interaction tool.\n" +
        "When the user wants to edit specific fields, use the edit_interaction tool.\n" +
        "Current form state: " + JSON.stringify(formState)
      })
    ];

    for (const m of messages) {
      if (m.role === "user") {
        lcMessages.push(new HumanMessage({ content: m.content as string }));
      } else if (m.role === "assistant") {
        lcMessages.push(new AIMessage({ content: m.content as string }));
      }
    }

    const finalState = await agent.invoke({ messages: lcMessages });
    const responseMessages = finalState.messages;
    
    // Check if the agent called the tool and what the last tool call data was to send back updated form state
    let updatedFormState = { ...formState };
    
    const lastMessage = responseMessages[responseMessages.length - 1];
    
    // If the agent made tool calls, we can inspect the history to find the tool return values
    for (const msg of responseMessages) {
      if (msg._getType() === "tool") {
         if (msg.name === "log_interaction" || msg.name === "edit_interaction") {
             const updates = JSON.parse(msg.content as string);
             updatedFormState = { ...updatedFormState, ...updates };
         }
      }
    }

    res.json({
      message: lastMessage.content,
      updatedFormState
    });

  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});
