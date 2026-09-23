# RoomFlow working contract

Build the approved C7 plan: a need-first ANU study-space booking prototype.
Read the C7 brief and spec before changing scope. Keep the course Astro,
Drizzle, SQLite, single Fly machine and persistent volume architecture.

- All room details and availability are explicitly demonstration data.
  Never claim these are actual ANU reservations or collect student identities.
- Booking state belongs in SQLite, never localStorage. Commit migrations.
- Validate every input on the server: 30-minute slots, 30–120 minutes,
  08:00–22:00 Canberra wall time, today through 30 days ahead.
- Capacity, purpose and every requested facility must match. Recheck
  availability inside an immediate transaction before inserting.
- Half-open intervals allow adjacent bookings but reject overlaps. Add a
  database trigger too. Stale pages receive a useful 409 error.
- Preserve invariant and full README checks; replace only the guestbook test.
  Keep spec/routes.ts complete and test the built server over HTTP.
- Record a real failing test before implementing the core flow.
- Verify 1920×1080 and 390×844, keyboard, refresh, duplicate submission,
  stale availability and live updates. Never weaken tests to pass.
- Keep CSRF on. SSE announces inventory changes, never user data.
- Commit in stages. Cite real work in PROCESS.md. Never invent user feedback,
  personal experience, test results or the student's reflection.
- README includes the use link and rationale; /readme/ serves it in full.
- Before shipping: pnpm check, pnpm check:evidence, browser review, clean
  secrets scan, and verification of the actual Fly deployment.
