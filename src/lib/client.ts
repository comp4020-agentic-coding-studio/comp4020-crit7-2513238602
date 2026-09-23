export {};
type Room = { id: string; name: string; building: string; floor: string; capacity: number; mode: string;
  description: string; whiteboard: boolean; screen: boolean; accessible: boolean; nextBooking: number | null };
type Booking = { id: string; date: string; start: number; end: number; people: number; roomName: string; building: string };
const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const form = $<HTMLFormElement>('#search-form');
const results = $('#rooms');
const status = $('#search-status');
const dialog = $<HTMLDialogElement>('#booking-dialog');
const confirm = $<HTMLButtonElement>('#confirm-booking');
const bookingStatus = $('#booking-status');
const dialogTitle = $('#dialog-title');
const dialogDetails = $('#dialog-details');
const summary = $('#result-summary');
const clock = (n: number) => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
const dateLabel = (date: string) => new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'));
let activeQuery = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
let selected: { id: string; name: string; building: string } | null = null;
let busy = false;
let requestVersion = 0;
let pendingController: AbortController | null = null;
let bookingVersion = 0;
let lastTrigger: HTMLButtonElement | null = null;
const escapeText = (s: string) => s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!));
function roomMarkup(room: Room) {
  const features = [room.mode === 'quiet' ? 'Quiet study' : 'Group work', room.whiteboard && 'Whiteboard', room.screen && 'Display', room.accessible && 'Step-free'].filter(Boolean);
  return `<article class="room-card"><div class="room-art ${room.mode === 'quiet' ? 'quiet' : 'group'}" aria-hidden="true"><span class="art-window"></span><span class="art-shelf"></span><span class="art-rug"></span><span class="art-table"></span><span class="art-chair chair-one"></span><span class="art-chair chair-two"></span><span class="art-plant"></span><span class="art-label">${room.mode === 'quiet' ? 'A LITTLE HEADSPACE' : 'BETTER TOGETHER'}</span><span class="capacity">${room.capacity} seats</span></div><div class="card-body"><div class="card-meta"><span>${escapeText(room.building)}</span><span class="available">Available</span></div><h3>${escapeText(room.name)}</h3><p class="floor">${escapeText(room.floor)}</p><p class="room-description">${escapeText(room.description)}</p><ul class="features" aria-label="Room facilities">${features.map(f => '<li>' + escapeText(String(f)) + '</li>').join('')}</ul><div class="card-bottom"><span>${room.nextBooking === null ? 'No later bookings today' : 'Next booking ' + clock(room.nextBooking)}</span><button type="button" class="choose-room" data-room-id="${escapeText(room.id)}" data-room-name="${escapeText(room.name)}" data-building="${escapeText(room.building)}" aria-label="Choose ${escapeText(room.name)}">Choose room <span aria-hidden="true">↗</span></button></div></div></article>`;
}
function describe(query: URLSearchParams) {
  const time = query.get('time')!;
  const start = Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  return dateLabel(query.get('date')!) + ' · ' + time + '–' + clock(start + Number(query.get('duration'))) + ' · Canberra time';
}
async function search(query: URLSearchParams, silent = false) {
  const version = ++requestVersion;
  pendingController?.abort();
  pendingController = new AbortController();
  results.setAttribute('aria-busy', 'true');
  results.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = true);
  if (!silent) status.textContent = 'Finding a space that fits…';
  try {
    const response = await fetch('/api/rooms?' + query, { signal: pendingController.signal });
    const data = await response.json();
    if (version !== requestVersion) return;
    if (!response.ok) throw new Error(data.error);
    activeQuery = new URLSearchParams(query);
    const rooms = data.rooms as Room[];
    results.innerHTML = rooms.map(roomMarkup).join('');
    $('#empty-state').hidden = rooms.length !== 0;
    $('#result-count').textContent = String(rooms.length).padStart(2, '0');
    summary.textContent = describe(query);
    status.textContent = silent ? 'Availability is up to date.' : rooms.length + ' spaces match your plans.';
    const url = new URL(location.href); url.search = query.toString();
    history.replaceState(null, '', url);
  } catch (error) {
    if (version !== requestVersion || (error instanceof Error && error.name === 'AbortError')) return;
    status.textContent = error instanceof Error ? error.message : 'Search unavailable. Please try again.';
    // Stale results cannot be reserved after a failed or invalid search.
    results.innerHTML = '';
    $('#result-count').textContent = '—';
    summary.textContent = 'Update your search to see availability';
    $('#empty-state').hidden = true;
  } finally {
    if (version === requestVersion) results.setAttribute('aria-busy', 'false');
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (dialog.open && !busy) dialog.close();
  void search(new URLSearchParams(new FormData(form) as unknown as Record<string, string>));
});
form.addEventListener('change', () => {
  if (dialog.open && !busy) dialog.close();
  results.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = true);
  status.textContent = 'Your preferences changed. Select Find a space to update results.';
});
results.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('.choose-room');
  if (!button) return;
  lastTrigger = button;
  selected = { id: button.dataset.roomId!, name: button.dataset.roomName!, building: button.dataset.building! };
  dialogTitle.textContent = selected.name;
  dialogDetails.textContent = selected.building + ' · ' + describe(activeQuery) + ' · ' + activeQuery.get('people') + ' people';
  bookingStatus.textContent = '';
  confirm.hidden = false; confirm.disabled = false; confirm.textContent = 'Confirm demo booking';
  $('#dialog-close').textContent = 'Go back';
  $('#confirmation-icon').hidden = true;
  dialog.showModal();
});
$('#dialog-close').addEventListener('click', () => { if (!busy) dialog.close(); });
dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
dialog.addEventListener('close', () => { selected = null; if (lastTrigger?.isConnected) lastTrigger.focus(); else $<HTMLButtonElement>('#find-spaces').focus(); });
confirm.addEventListener('click', async () => {
  if (!selected || busy) return;
  busy = true; confirm.disabled = true; confirm.textContent = 'Confirming…';
  $<HTMLButtonElement>('#dialog-close').disabled = true;
  bookingStatus.textContent = 'Checking this time and saving your booking…';
  const body = new URLSearchParams(activeQuery); body.set('roomId', selected.id);
  try {
    const response = await fetch('/api/bookings', { method: 'POST', body, signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    dialogTitle.textContent = 'A space for your next idea.';
    $('#confirmation-icon').hidden = false;
    bookingStatus.textContent = 'Confirmed · ' + data.booking.id.slice(0, 8) + '. Your demo booking is saved and will still be here after a refresh.';
    confirm.hidden = true;
    $('#dialog-close').textContent = 'Back to spaces';
    await Promise.all([search(activeQuery, true), refreshBookings()]);
  } catch (error) {
    bookingStatus.textContent = error instanceof Error && error.name === 'TimeoutError'
      ? 'Confirmation took too long. Close this window and check the bookings list before retrying.'
      : error instanceof Error ? error.message : 'Could not confirm. Check the bookings list before retrying.';
    confirm.textContent = 'Try again'; confirm.disabled = false;
    void refreshBookings();
    void search(activeQuery, true);
  } finally {
    busy = false;
    $<HTMLButtonElement>('#dialog-close').disabled = false;
    if (confirm.hidden) $<HTMLButtonElement>('#dialog-close').focus();
  }
});
async function refreshBookings() {
  const version = ++bookingVersion;
  try {
    const response = await fetch('/api/bookings');
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (version !== bookingVersion) return;
    const bookings = data.bookings as Booking[];
    $('#booking-list').innerHTML = bookings.map(b => `<li><div><strong>${escapeText(b.roomName)}</strong><span>${escapeText(b.building)} · ${b.people} people</span></div><div><strong>${dateLabel(b.date)} · ${clock(b.start)}–${clock(b.end)}</strong><span>Confirmed · ${escapeText(b.id.slice(0, 8))}</span></div></li>`).join('');
    $('#no-bookings').hidden = bookings.length !== 0;
    $('#bookings-count').textContent = String(bookings.length);
    $('#booking-refresh-status').textContent = 'Bookings up to date.';
  } catch { $('#booking-refresh-status').textContent = 'Could not update bookings. Select Refresh to try again.'; }
}
$('#refresh-bookings').addEventListener('click', () => { void refreshBookings(); });
$('#reset-filters').addEventListener('click', () => {
  $<HTMLSelectElement>('#mode').value = 'any'; $<HTMLSelectElement>('#people').value = '1';
  form.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(i => i.checked = false);
  form.requestSubmit();
});
const source = new EventSource('/api/events');
source.addEventListener('message', () => {
  // Do not overwrite unsubmitted filter edits when another visitor books.
  const current = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
  if (current.toString() === activeQuery.toString()) void search(activeQuery, true);
  void refreshBookings();
});
source.addEventListener('open', () => {
  $('#live-status').textContent = 'Live availability';
  const current = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
  if (current.toString() === activeQuery.toString()) void search(activeQuery, true);
  void refreshBookings();
});
source.addEventListener('error', () => { $('#live-status').textContent = 'Reconnecting · search still works'; });
