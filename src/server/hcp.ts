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

hcpRouter.get("/:name/interactions", async (req, res) => {
  try {
    const history = await db.select().from(interactions).where(eq(interactions.hcpName, req.params.name)).orderBy(desc(interactions.createdAt));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
