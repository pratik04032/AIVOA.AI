import { Router } from "express";
import { db } from "./db/index.js";
import { hcps, interactions } from "./db/schema.js";
import { eq, desc } from "drizzle-orm";

export const hcpRouter = Router();

hcpRouter.get("/", async (req, res) => {
  try {
    const allHcps = await db.select().from(hcps);
    res.json(allHcps);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.get("/interactions/recent", async (req, res) => {
  try {
    const history = await db.select().from(interactions).orderBy(desc(interactions.createdAt)).limit(10);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.get("/:name/interactions", async (req, res) => {
  try {
    const history = await db.select().from(interactions).where(eq(interactions.hcpName, req.params.name)).orderBy(desc(interactions.createdAt));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.post("/interactions", async (req, res) => {
  try {
    const data = req.body;
    const result = await db.insert(interactions).values({
      hcpName: data.hcpName || "Unknown HCP",
      interactionType: data.interactionType,
      date: data.date,
      time: data.time,
      attendees: data.attendees,
      topicsDiscussed: data.topicsDiscussed,
      materialsShared: data.materialsShared,
      sentiment: data.sentiment,
      outcomes: data.outcomes,
      followUpActions: data.followUpActions,
      summary: data.executiveSummary,
    }).returning();
    res.json(result[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
