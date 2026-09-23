export class BookingError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function canberraNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const value = (type: string) => parts.find(p => p.type === type)!.value;
  return { date: `${value('year')}-${value('month')}-${value('day')}`, minute: Number(value('hour')) * 60 + Number(value('minute')) };
}
export function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
export const clock = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
export function defaults() {
  const now = canberraNow();
  const start = Math.max(480, Math.ceil((now.minute + 5) / 30) * 30);
  return { date: start > 1260 ? addDays(now.date, 1) : now.date, time: clock(start > 1260 ? 600 : start),
    duration: '60', people: '2', mode: 'group' };
}
export type Criteria = { date: string; start: number; end: number; people: number; mode: string;
  whiteboard: boolean; screen: boolean; accessible: boolean };
export function parseCriteria(input: URLSearchParams | FormData): Criteria {
  const get = (key: string) => String(input.get(key) ?? '');
  const date = get('date');
  const time = get('time');
  const now = canberraNow();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) ||
    new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date || date < now.date || date > addDays(now.date, 30))
    throw new BookingError('Choose a valid date from today through the next 30 days.');
  if (!/^\d{2}:(00|30)$/.test(time)) throw new BookingError('Choose a start time on the hour or half hour.');
  const start = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const duration = Number(get('duration'));
  if (![30, 60, 90, 120].includes(duration) || start < 480 || start + duration > 1320)
    throw new BookingError('Choose 30–120 minutes between 08:00 and 22:00 Canberra time.');
  if (date === now.date && start <= now.minute) throw new BookingError('That start time has passed. Choose a later time.');
  const people = Number(get('people'));
  if (!Number.isInteger(people) || people < 1 || people > 12) throw new BookingError('Choose between 1 and 12 people.');
  const mode = get('mode');
  if (!['group', 'quiet', 'any'].includes(mode)) throw new BookingError('Choose group work or quiet study.');
  const feature = (key: string) => {
    if (!['', '1'].includes(get(key))) throw new BookingError('Choose a valid facility filter.');
    return get(key) === '1';
  };
  return { date, start, end: start + duration, people, mode,
    whiteboard: feature('whiteboard'), screen: feature('screen'), accessible: feature('accessible') };
}
