import { Router } from "express";
import { agent } from "./agent/index.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

export const chatRouter = Router();

chatRouter.post("/", async (req, res) => {
  try {
    const { messages, formState } = req.body;
    
    // Construct LangChain messages
    const lcMessages = [
      new SystemMessage(
        "You are an AI assistant helping a life science field representative log interactions with Healthcare Professionals (HCPs).\n" +
        "You can use the provided tools to extract interaction data from the user's natural language input.\n" +
        "When the user wants to log an interaction, use the log_interaction tool.\n" +
        "When the user wants to edit specific fields, use the edit_interaction tool.\n" +
        "Current form state: " + JSON.stringify(formState)
      )
    ];

    for (const m of messages) {
      if (m.role === "user") {
        lcMessages.push(new HumanMessage(m.content));
      } else if (m.role === "assistant") {
        lcMessages.push(new AIMessage(m.content));
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
             const updates = JSON.parse(msg.content);
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
