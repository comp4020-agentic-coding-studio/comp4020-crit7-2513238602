import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import { and, asc, eq, gt, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { bookings, rooms, type Room } from './schema';
import { BookingError, canberraNow, type Criteria } from './booking-rules';

const path = process.env.DATABASE_PATH ?? './.data/app.db';
mkdirSync(dirname(path), { recursive: true });
export const client = new Database(path);
client.pragma('journal_mode = WAL');
client.pragma('foreign_keys = ON');
client.pragma('busy_timeout = 5000');
export const db = drizzle(client);
migrate(db, { migrationsFolder: './drizzle' });

const inventory: Room[] = [
  { id: 'chifley-01', name: 'The Collaboration Room', building: 'Chifley Library', floor: 'Demo room C01 · Level 2', capacity: 6, mode: 'group', whiteboard: true, screen: true, accessible: true, description: 'Room to spread out, sketch an idea and get the group unstuck.' },
  { id: 'chifley-02', name: 'The Window Nook', building: 'Chifley Library', floor: 'Demo room C02 · Level 3', capacity: 2, mode: 'quiet', whiteboard: false, screen: false, accessible: true, description: 'A little daylight and a little distance from the distractions.' },
  { id: 'hancock-01', name: 'The Project Studio', building: 'Hancock Library', floor: 'Demo room H01 · Ground floor', capacity: 8, mode: 'group', whiteboard: true, screen: true, accessible: true, description: 'Big ideas welcome. Bring your team, your notes and a fresh marker.' },
  { id: 'hancock-02', name: 'The Focus Room', building: 'Hancock Library', floor: 'Demo room H02 · Level 1', capacity: 4, mode: 'quiet', whiteboard: false, screen: true, accessible: true, description: 'Settle into deep work with space for your reference material.' },
  { id: 'menzies-01', name: 'The Discussion Room', building: 'Menzies Library', floor: 'Demo room M01 · Level 2', capacity: 4, mode: 'group', whiteboard: true, screen: false, accessible: false, description: 'A small table for the conversations that move a project forward.' },
  { id: 'law-01', name: 'The Reading Room', building: 'Law Library', floor: 'Demo room L01 · Ground floor', capacity: 2, mode: 'quiet', whiteboard: false, screen: false, accessible: true, description: 'A calm corner for one more chapter, or the final draft.' },
];
db.transaction(tx => { for (const room of inventory) tx.insert(rooms).values(room).onConflictDoNothing().run(); });

export function matches(room: Room, query: Criteria) {
  return room.capacity >= query.people && (query.mode === 'any' || room.mode === query.mode) &&
    (!query.whiteboard || room.whiteboard) && (!query.screen || room.screen) && (!query.accessible || room.accessible);
}
function overlaps(roomId: string, query: Criteria) {
  return db.select().from(bookings).where(and(eq(bookings.roomId, roomId), eq(bookings.date, query.date),
    lt(bookings.start, query.end), gt(bookings.end, query.start))).get();
}
export function availableRooms(query: Criteria) {
  return db.select().from(rooms).orderBy(asc(rooms.capacity), asc(rooms.name)).all()
    .filter(room => matches(room, query) && !overlaps(room.id, query))
    .map(room => ({ ...room, nextBooking: db.select({ start: bookings.start }).from(bookings)
      .where(and(eq(bookings.roomId, room.id), eq(bookings.date, query.date), gt(bookings.start, query.start)))
      .orderBy(asc(bookings.start)).get()?.start ?? null }));
}
export function createBooking(roomId: string, query: Criteria) {
  return client.transaction(() => {
    const room = db.select().from(rooms).where(eq(rooms.id, roomId)).get();
    if (!room || !matches(room, query)) throw new BookingError('This room does not match your requirements. Search again.');
    if (overlaps(roomId, query)) throw new BookingError('Someone just booked this time. Your booking was not created. Choose another room or time.', 409);
    const booking = db.insert(bookings).values({ id: randomUUID(), roomId, date: query.date,
      start: query.start, end: query.end, people: query.people }).returning().get();
    return { ...booking, roomName: room.name, building: room.building };
  }).immediate();
}
export function listBookings() {
  const now = canberraNow();
  return db.select({ id: bookings.id, date: bookings.date, start: bookings.start, end: bookings.end,
    people: bookings.people, roomName: rooms.name, building: rooms.building })
    .from(bookings).innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .orderBy(asc(bookings.date), asc(bookings.start)).all()
    .filter(b => b.date > now.date || (b.date === now.date && b.end > now.minute)).slice(0, 60);
}

