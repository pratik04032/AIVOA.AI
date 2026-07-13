import { Express } from "express";
import { chatRouter } from "./chat.js";
import { hcpRouter } from "./hcp.js";

export function setupRoutes(app: Express) {
  app.use("/api/chat", chatRouter);
  app.use("/api/hcps", hcpRouter);
}
