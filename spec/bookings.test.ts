import { describe, expect, inject, it } from 'vitest';
const base = inject('baseUrl');
const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
const criteria = { date: future, time: '10:00', duration: '60', people: '2', mode: 'group' };
const search = (extra = {}) => fetch(`${base}/api/rooms?${new URLSearchParams({ ...criteria, ...extra })}`);
const book = (extra = {}) => fetch(`${base}/api/bookings`, {
  method: 'POST', headers: { origin: base },
  body: new URLSearchParams({ ...criteria, roomId: 'chifley-01', ...extra }),
});
describe('RoomFlow HTTP contract', () => {
  it('filters by every requested feature and capacity', async () => {
    const response = await search({ people: '6', whiteboard: '1', screen: '1', accessible: '1' });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.rooms.length).toBeGreaterThan(0);
    for (const room of data.rooms) {
      expect(room.capacity).toBeGreaterThanOrEqual(6);
      expect(room.whiteboard && room.screen && room.accessible).toBeTruthy();
    }
  });
  it('persists a booking, hides it from search and allows adjacent slots', async () => {
    const response = await book();
    expect(response.status).toBe(201);
    const booking = await response.json();
    expect(booking.booking.id).toBeTruthy();
    expect(await (await fetch(base)).text()).toContain(booking.booking.id);
    expect((await (await search()).json()).rooms.some((r: { id: string }) => r.id === 'chifley-01')).toBe(false);
    expect((await book({ time: '11:00' })).status).toBe(201);
  });
  it('rejects conflicts submitted directly or concurrently', async () => {
    const results = await Promise.all(Array.from({ length: 5 }, () => book({ time: '14:00' })));
    expect(results.filter(r => r.status === 201)).toHaveLength(1);
    expect(results.filter(r => r.status === 409)).toHaveLength(4);
    expect((await book({ time: '14:30' })).status).toBe(409);
  });
  it('rejects invalid inputs and impossible room requirements', async () => {
    for (const input of [{ date: '2026-02-30' }, { date: '2001-01-01' }, { duration: '-60' },
      { duration: '150' }, { time: '21:30', duration: '120' }, { time: '10:13' },
      { people: '0' }, { people: '99' }, { mode: 'x'.repeat(1000) }, { roomId: 'missing' },
      { people: '12' }, { mode: 'quiet' }]) {
      expect((await book(input)).status).toBe(400);
    }
    expect((await search({ date: '' })).status).toBe(400);
  });
  it('refuses cross-origin form writes', async () => {
    const response = await fetch(`${base}/api/bookings`, { method: 'POST',
      headers: { origin: 'https://example.org' }, body: new URLSearchParams(criteria) });
    expect(response.status).toBe(403);
  });
  it('broadcasts inventory changes without booking details', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${base}/api/events`, { signal: controller.signal });
      const reader = response.body!.getReader();
      await book({ time: '17:00' });
      let received = '';
      while (!received.includes('data:')) received += new TextDecoder().decode((await reader.read()).value);
      expect(received).toContain('availability');
      expect(received).not.toContain('chifley-01');
      await reader.cancel();
    } finally { clearTimeout(timeout); controller.abort(); }
  });
});
