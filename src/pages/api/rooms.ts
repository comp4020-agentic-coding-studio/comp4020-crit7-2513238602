import type { APIRoute } from 'astro';
import { availableRooms } from '../../lib/repository';
import { BookingError, parseCriteria } from '../../lib/booking-rules';
export const GET: APIRoute = ({ url }) => {
  try { return Response.json({ rooms: availableRooms(parseCriteria(url.searchParams)) }, { headers: { 'cache-control': 'no-store' } }); }
  catch (error) {
    if (error instanceof BookingError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
};

