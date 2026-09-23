# RoomFlow — make room for good work

**[Open RoomFlow →](https://comp4020-crit7-2513238602.fly.dev/)**

A student-made alternative to room-first campus booking: start with when you
want to study, how many people are coming, and the facilities you need.
RoomFlow finds matching spaces and saves a booking on the server.
Built for COMP4020/COMP8020 C7.

**Demonstration only.** All room names, capacities, facilities, hours and
availability are fictional. Bookings are shared demonstration records,
not actual ANU reservations. No account or personal information is requested.

## Try it

1. Choose a date, start time, duration, group size and study style.
2. Select optional whiteboard, display or step-free requirements.
3. Select **Find a space**, choose a matching room, and confirm.
4. Refresh: your record stays in **Plans with a place**.
5. Open another tab with the same search. A booking updates availability
   in both tabs. If a room is taken while its confirmation is open, the
   server refuses the second booking and explains what to do.

Demo hours are 08:00–22:00 Canberra time, in half-hour slots. Book for
30–120 minutes, today through 30 days ahead. The upcoming list shows the
next 60 shared bookings. There is no cancellation or editing workflow in
this first slice; choose another slot to repeat a demonstration.

## What good looks like here

The position is simple: a student should be able to describe a study session
before choosing a building. The [ANU Library announcement about Chifley
bookable spaces](https://anulib.anu.edu.au/news-events/news/bookable-spaces-chifley-library)
describes expansion beyond group rooms to desks and booths. That is a useful
grounding for a needs-first interface. It is not evidence that the existing
system is broken, and this prototype does not copy its inventory.

A match must meet every requested facility and capacity constraint.
Availability is rechecked inside a SQLite immediate transaction at confirmation;
a database trigger also rejects overlapping inserts. Adjacent sessions are
allowed. Those are enforced contracts, covered by HTTP tests. Canberra wall
time is explicit throughout; it does not change with the visitor's timezone.
This prototype's opening hours avoid daylight-saving transition hours.

Clarity is a separate judgement: the cream-and-green palette, room
illustrations, restrained copy and three-step structure should make the next
action obvious. Browser review covers keyboard focus, both marking viewports
and real confirmation feedback; the automated accessibility floor alone
cannot prove those qualities.

Scope deliberately excludes ANU sign-in, real campus integration, maps,
payments and accounts. Shared records have no owner or private purpose.
This is a bounded booking prototype, not a production campus service.

## Run locally

Use Node 24 and pnpm. From the repository directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm check:evidence
```

Local data lives in the ignored `.data/app.db`. Drizzle migrations run at
server startup; change the schema with `pnpm db:generate`. SQLite 13 ships
native binaries, so its redundant install-time rebuild is disabled.

## Deployment and evidence

The course Fly app uses one machine and its persistent `/data` volume.
After the repository is public, pushes to main run checks and deploy.
The GitHub secret `FLY_API_TOKEN` is already configured; tokens never belong
in source files.

The repository contains `CLAUDE.md` (working rules), `spec/` (contracts),
`PROCESS.md` (development evidence), `docs/acceptance.md` (verification)
and `reflections/crit-7.md` (reflection draft for the student's review).
This README is also published in full at `/readme/`.
