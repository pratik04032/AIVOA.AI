import { Router } from "express";
import { db } from "./db/index.js";

export const hcpRouter = Router();

hcpRouter.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection('hcps').get();
    const allHcps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(allHcps);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.get("/interactions/recent", async (req, res) => {
  try {
    const snapshot = await db.collection('interactions')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.get("/:name/interactions", async (req, res) => {
  try {
    const snapshot = await db.collection('interactions')
      .where('hcpName', '==', req.params.name)
      .orderBy('createdAt', 'desc')
      .get();
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.post("/interactions", async (req, res) => {
  try {
    const data = req.body;
    const newDoc = {
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
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection('interactions').add(newDoc);
    res.json({ id: docRef.id, ...newDoc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
