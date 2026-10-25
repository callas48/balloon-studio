CREATE TABLE `analytics_days` (
	`day` text PRIMARY KEY NOT NULL,
	`views` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `analytics_visits` (
	`day` text NOT NULL,
	`visitor` text NOT NULL,
	`last_seen` integer NOT NULL,
	PRIMARY KEY(`day`, `visitor`)
);
