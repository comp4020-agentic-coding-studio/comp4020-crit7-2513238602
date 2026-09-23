# Crit 7 reflection — draft for student review

This draft is based on the recorded implementation. It needs the student's
own judgement before being treated as a personal reflection.

## What was the breakthrough that moved the work forward?

The practical breakthrough was treating availability as a promise that must
survive a second visitor. Filtering a list was straightforward; ensuring that
two confirmations could not reserve the same space required a different
standard of correctness. An immediate SQLite transaction and an overlap
constraint made the database authoritative. The competing-request test made
that decision observable: one booking succeeded and four were rejected.
The interface could then offer a useful conflict message instead of presenting
a false confirmation.

## What did this work change about who I want to be as a software developer?

A possible reflection to discuss is the relationship between pleasant
interfaces and trustworthy behaviour. RoomFlow makes a simple promise to its
visitor, so the engineering work should protect that promise at the point
where it can fail. Browser testing also found a keyboard-focus problem that
the automated checks missed. These two findings suggest a development
practice that combines explicit contracts with attention to actual use.

The student should replace this paragraph with their own experience of ANU
booking, their reaction to the prototype, and whether this proposed lesson
matches what they learned. No personal experience has been assumed.

