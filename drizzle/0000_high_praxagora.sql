CREATE TABLE `bars` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`slug` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bars_owner_id_unique` ON `bars` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bars_slug_unique` ON `bars` (`slug`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`bar_id` text NOT NULL,
	`kind` text NOT NULL,
	`product_id` text,
	`value` text,
	`day` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bar_id`) REFERENCES `bars`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `events_bar_day` ON `events` (`bar_id`,`day`);