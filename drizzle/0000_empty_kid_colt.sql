CREATE TABLE `guestbook_bans` (
	`ipHash` text PRIMARY KEY NOT NULL,
	`expiresAt` integer
);
--> statement-breakpoint
CREATE TABLE `guestbook_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`reply` text,
	`isPrivate` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`ipHash` text NOT NULL,
	`createdAt` integer NOT NULL
);
