import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "../db/index.js";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";

export const logInteractionTool = tool(
  async (input) => {
    return JSON.stringify(input);
  },
  {
    name: "log_interaction",
    description: "Use this to capture and extract interaction data from user chat to fill the log interaction form.",
    schema: z.object({
      hcpName: z.string().optional().describe("Name of the HCP, e.g. Dr. Smith"),
      interactionType: z.string().optional().describe("Type of interaction, e.g. Meeting, Call"),
      date: z.string().optional().describe("Date of interaction, YYYY-MM-DD"),
      time: z.string().optional().describe("Time of interaction, HH:MM"),
      attendees: z.string().optional().describe("Attendees names"),
      topicsDiscussed: z.string().optional().describe("Topics discussed"),
      materialsShared: z.string().optional().describe("Materials shared"),
      sentiment: z.enum(["Positive", "Neutral", "Negative"]).optional().describe("Inferred sentiment"),
      outcomes: z.string().optional().describe("Outcomes or agreements"),
      followUpActions: z.string().optional().describe("Next steps or tasks")
    })
  }
);

export const editInteractionTool = tool(
  async (input) => {
    return JSON.stringify(input);
  },
  {
    name: "edit_interaction",
    description: "Use this to modify specific fields in the already logged interaction data.",
    schema: z.object({
      hcpName: z.string().optional(),
      interactionType: z.string().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
      attendees: z.string().optional(),
      topicsDiscussed: z.string().optional(),
      materialsShared: z.string().optional(),
      sentiment: z.enum(["Positive", "Neutral", "Negative"]).optional(),
      outcomes: z.string().optional(),
      followUpActions: z.string().optional()
    })
  }
);

export const searchHcpsTool = tool(
  async ({ query: searchQuery }) => {
    const snapshot = await getDocs(collection(db, 'hcps'));
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((hcp: any) => hcp.name && hcp.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return JSON.stringify(results);
  },
  {
    name: "search_hcps",
    description: "Search for HCPs in the database by name.",
    schema: z.object({
      query: z.string().describe("Search query for HCP name")
    })
  }
);

export const getInteractionHistoryTool = tool(
  async ({ hcpName }) => {
    const q = query(collection(db, 'interactions'), where('hcpName', '==', hcpName), orderBy('createdAt', 'desc'), limit(5));
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return JSON.stringify(history);
  },
  {
    name: "get_interaction_history",
    description: "Retrieve previous interactions for an HCP.",
    schema: z.object({
      hcpName: z.string().describe("Name of the HCP")
    })
  }
);

export const suggestFollowUpsTool = tool(
  async ({ context }) => {
    // A mock suggestion tool for follow ups. Usually this could call another LLM chain.
    return JSON.stringify(["Schedule a follow-up call next week", "Send product efficacy brochure"]);
  },
  {
    name: "suggest_follow_ups",
    description: "Generate follow-up actions based on interaction context.",
    schema: z.object({
      context: z.string().describe("Context of the interaction to generate follow-ups for")
    })
  }
);

export const tools = [
  logInteractionTool,
  editInteractionTool,
  searchHcpsTool,
  getInteractionHistoryTool,
  suggestFollowUpsTool
];
