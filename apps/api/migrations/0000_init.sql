CREATE TABLE `assignments` (
	`event_id` text NOT NULL,
	`giver_id` text NOT NULL,
	`receiver_id` text NOT NULL,
	PRIMARY KEY(`event_id`, `giver_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`giver_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`receiver_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`fingerprint` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `devices_token_hash_unique` ON `devices` (`token_hash`);--> statement-breakpoint
CREATE INDEX `devices_fingerprint_idx` ON `devices` (`fingerprint`);--> statement-breakpoint
CREATE TABLE `event_admins` (
	`event_id` text NOT NULL,
	`device_id` text NOT NULL,
	PRIMARY KEY(`event_id`, `device_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_admins_device_idx` ON `event_admins` (`device_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`date` text,
	`budget` text,
	`admin_password_hash` text NOT NULL,
	`admin_password_salt` text NOT NULL,
	`failed_logins` integer DEFAULT 0 NOT NULL,
	`login_window_start` integer,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_token_unique` ON `events` (`token`);--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`device_id` text,
	`claimed_at` integer,
	`revealed_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_event_name_unique` ON `participants` (`event_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `participants_device_event_unique` ON `participants` (`device_id`,`event_id`);