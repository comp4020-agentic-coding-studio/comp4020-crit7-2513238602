# RoomFlow acceptance record

## Contract before implementation
C7 brief checked on 23 September 2026; it still carries a Draft notice.
Approved idea: requirements-first demo room booking, not live ANU reservations.

First run: `pnpm test -- spec/bookings.test.ts` against the unmodified guestbook:
5 failed, 29 passed. New routes returned 404; inventory SSE test timed out.
The inherited CSRF test already passed. This is the red baseline.

## Release gates
- Search matches capacity, activity and every selected facility.
- Create a booking, fetch a fresh server-rendered page, see the same ID.
- Competing requests produce exactly one booking; overlapping requests get 409.
- Adjacent bookings succeed; invalid dates, inputs and requirements fail with 400.
- Another client receives an inventory-change event without personal data.
- Default invariant, README and evidence checks pass.
- Browser: desktop 1920×1080, phone 390×844, keyboard, refresh and resize.
- Production: Fly deployment, actual booking persistence and conflict rejection.

## Research and scope
ANU Library's 2026 Chifley bookable-spaces announcement confirms an existing
booking workflow and an expansion to booths and desks:
https://anulib.anu.edu.au/news-events/news/bookable-spaces-chifley-library
This motivates filtering by needs. It does not prove the old interface is
unusable or that the student has personally used it. Inventory, names,
capacities, facilities and hours in RoomFlow are fictional demo data.

## Verified locally, 23 September 2026
- `pnpm check`: 31 tests passed; zero type errors, warnings or hints.
- `pnpm check:evidence`: reflection filename and four commit citations pass.
- 1920×1080: actual keyboard confirmation for Collaboration Room succeeded.
- 390×844: quiet-study search and Reading Room confirmation succeeded.
- DOM widths: desktop 1905 <= 1920; phone 375 <= 390 (scrollbar included).
- Reload retained both IDs; stopping and restarting the production server
  with the same SQLite file retained both records again.
- Two browser tabs opened the same Discussion Room confirmation. The second
  tab reserved it; the first received the expected conflict message, while
  the inventory and booking list updated live.
- Successful confirmation now puts keyboard focus on `dialog-close`.
- A search for 12 people shows an actionable empty state.
- Browser UI and HTTP checks use the actual production server build.

The personal reflection remains explicitly a draft awaiting the student's
own assessment; mechanical evidence checks do not certify its authorship.
