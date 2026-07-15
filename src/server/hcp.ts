import { Router } from "express";
import { db } from "./db/index.js";
import { collection, getDocs, query, orderBy, limit, where, addDoc } from "firebase/firestore";

export const hcpRouter = Router();

hcpRouter.get("/", async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, 'hcps'));
    const allHcps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(allHcps);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.get("/interactions/all", async (req, res) => {
  try {
    const q = query(collection(db, 'interactions'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.get("/interactions/recent", async (req, res) => {
  try {
    const q = query(collection(db, 'interactions'), orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.get("/:name/interactions", async (req, res) => {
  try {
    const q = query(collection(db, 'interactions'), where('hcpName', '==', req.params.name), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

hcpRouter.post("/interactions", async (req, res) => {
  try {
    const data = req.body;
    const newDoc: any = {
      hcpName: data.hcpName || "Unknown HCP",
      interactionType: data.interactionType,
      date: data.date,
      time: data.time,
      attendees: data.attendees,
      topicsDiscussed: data.topicsDiscussed,
      materialsShared: data.materialsShared,
      samplesDistributed: data.samplesDistributed,
      sentiment: data.sentiment,
      outcomes: data.outcomes,
      followUpActions: data.followUpActions,
      followUpDate: data.followUpDate,
      summary: data.executiveSummary || data.summary,
      createdAt: new Date().toISOString(),
    };
    
    // Remove undefined fields
    Object.keys(newDoc).forEach(key => {
      if (newDoc[key] === undefined) {
        delete newDoc[key];
      }
    });

    const docRef = await addDoc(collection(db, 'interactions'), newDoc);
    res.json({ id: docRef.id, ...newDoc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
