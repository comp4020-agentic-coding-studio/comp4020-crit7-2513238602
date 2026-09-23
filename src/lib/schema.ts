import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
export const rooms = sqliteTable('rooms', {
  id: text().primaryKey(),
  name: text().notNull(),
  building: text().notNull(),
  floor: text().notNull(),
  capacity: int().notNull(),
  mode: text().notNull(),
  whiteboard: int({ mode: 'boolean' }).notNull(),
  screen: int({ mode: 'boolean' }).notNull(),
  accessible: int({ mode: 'boolean' }).notNull(),
  description: text().notNull(),
});
export const bookings = sqliteTable('bookings', {
  id: text().primaryKey(),
  roomId: text('room_id').notNull().references(() => rooms.id),
  date: text().notNull(),
  start: int().notNull(),
  end: int().notNull(),
  people: int().notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
export type Room = typeof rooms.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
