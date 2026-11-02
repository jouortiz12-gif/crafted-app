import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const bars = sqliteTable("bars", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().unique(),
  slug: text("slug").notNull().unique(),
  data: text("data").notNull(),
  revision: integer("revision").notNull().default(1),
  updatedAt: integer("updated_at").notNull(),
});
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    barId: text("bar_id")
      .notNull()
      .references(() => bars.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    productId: text("product_id"),
    value: text("value"),
    day: text("day").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("events_bar_day").on(t.barId, t.day)],
);
