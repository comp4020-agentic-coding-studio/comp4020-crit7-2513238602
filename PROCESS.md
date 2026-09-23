# RoomFlow process overview

RoomFlow implements the approved requirements-first room-booking plan:
filter, choose, confirm, then see the same booking after a reload. The
inventory is explicitly fictional; the workflow is grounded in ANU Library's
bookable-spaces context, linked in README.

The user instruction that authorised implementation was:

> 请你实现这个方案

Before implementation, the working rules and HTTP contracts were committed in
[`4a0b0c9`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-2513238602/commit/4a0b0c9).
The first test run against the starter produced five failures: the booking
and search routes returned 404, and no inventory event arrived. The existing
CSRF protection already passed. This established a concrete baseline rather
than treating an attractive interface as completion.

The schema and migration in
[`3da488b`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-2513238602/commit/3da488b)
encode room relationships and time ranges. The service implementation in
[`2c99da5`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-2513238602/commit/2c99da5)
rechecks availability inside an immediate transaction. Five competing requests
produce one successful booking and four conflicts; adjacent sessions remain
valid. This makes availability a server promise, not merely a label on a card.

The interface in
[`287192e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-2513238602/commit/287192e)
was exercised at 1920×1080 and 390×844. Both completed real bookings and
retained them after reload. Keyboard testing exposed a focus mistake:
the success button was focused while disabled. Moving focus until after
reenabling it corrected the interaction. All 31 tests passed in the first
complete implementation run; the acceptance record tracks subsequent checks.

This overview was prepared with the coding agent from the actual development
record. Personal experience and reflection require the student's review;
neither has been invented as test evidence.
