import type { APIRoute } from 'astro';
import { createBooking, listBookings } from '../../lib/repository';
import { BookingError, parseCriteria } from '../../lib/booking-rules';
import { bus } from '../../lib/events';
export const GET: APIRoute = () => Response.json({ bookings: listBookings() }, { headers: { 'cache-control': 'no-store' } });
export const POST: APIRoute = async ({ request }) => {
  try {
    if (!(request.headers.get('content-type') ?? '').startsWith('application/x-www-form-urlencoded'))
      throw new BookingError('Submit the booking form to reserve a room.');
    const raw = await request.text();
    if (raw.length > 2048) throw new BookingError('The booking request is too long.');
    const form = new URLSearchParams(raw);
    const query = parseCriteria(form);
    const booking = createBooking(String(form.get('roomId') ?? ''), query);
    bus.emit('message', { type: 'availability' });
    return Response.json({ booking }, { status: 201, headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    if (error instanceof BookingError) return Response.json({ error: error.message }, { status: error.status });
    console.error('Booking failed', error instanceof Error ? error.message : 'unknown');
    return Response.json({ error: 'We could not confirm that booking. Refresh the bookings list before trying again.' }, { status: 500 });
  }
};

