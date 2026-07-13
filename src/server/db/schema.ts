import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const interactions = sqliteTable("interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hcpName: text("hcp_name").notNull(),
  interactionType: text("interaction_type"),
  date: text("date"),
  time: text("time"),
  attendees: text("attendees"),
  topicsDiscussed: text("topics_discussed"),
  materialsShared: text("materials_shared"),
  sentiment: text("sentiment"),
  outcomes: text("outcomes"),
  followUpActions: text("follow_up_actions"),
  summary: text("summary"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const hcps = sqliteTable("hcps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  specialty: text("specialty"),
});
