CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`date` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`people` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`building` text NOT NULL,
	`floor` text NOT NULL,
	`capacity` integer NOT NULL,
	`mode` text NOT NULL,
	`whiteboard` integer NOT NULL,
	`screen` integer NOT NULL,
	`accessible` integer NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `messages`;
--> statement-breakpoint
CREATE INDEX bookings_room_date ON bookings (room_id, date, start, end);
--> statement-breakpoint
CREATE TRIGGER bookings_no_overlap BEFORE INSERT ON bookings
BEGIN
  SELECT RAISE(ABORT, 'booking_overlap') WHERE EXISTS (
    SELECT 1 FROM bookings WHERE room_id = NEW.room_id AND date = NEW.date
    AND start < NEW.end AND end > NEW.start
  );
  SELECT RAISE(ABORT, 'booking_invalid_range') WHERE NEW.start < 480
    OR NEW.end > 1320 OR NEW.end <= NEW.start
    OR NEW.start % 30 != 0 OR NEW.end % 30 != 0
    OR NEW.end - NEW.start > 120 OR NEW.people < 1;
END;
