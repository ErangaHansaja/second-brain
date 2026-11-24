CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`title` text NOT NULL,
	`node_type` text DEFAULT 'folder' NOT NULL,
	`depth` integer DEFAULT 0 NOT NULL,
	`icon` text,
	`color` text,
	`status` text,
	`rating` real,
	`tags` text DEFAULT '[]',
	`metadata` text DEFAULT '{}',
	`notes` text,
	`description` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
