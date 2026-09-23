CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_code` text NOT NULL,
	`location_type` text NOT NULL,
	`capacity` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `locations_location_code_unique` ON `locations` (`location_code`);--> statement-breakpoint
CREATE TABLE `lpns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lpn_code` text NOT NULL,
	`sku_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`current_location_id` integer NOT NULL,
	`status` text NOT NULL,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`sku_id`) REFERENCES `skus`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`current_location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lpns_lpn_code_unique` ON `lpns` (`lpn_code`);--> statement-breakpoint
CREATE INDEX `idx_lpns_location` ON `lpns` (`current_location_id`);--> statement-breakpoint
CREATE INDEX `idx_lpns_status` ON `lpns` (`status`);--> statement-breakpoint
CREATE INDEX `idx_lpns_received` ON `lpns` (`received_at`);--> statement-breakpoint
CREATE TABLE `mutation_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lpn_id` integer NOT NULL,
	`source_location_id` integer NOT NULL,
	`destination_location_id` integer NOT NULL,
	`action_type` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lpn_id`) REFERENCES `lpns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`destination_location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_mutations_lpn` ON `mutation_logs` (`lpn_id`);--> statement-breakpoint
CREATE TABLE `skus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sku_code` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skus_sku_code_unique` ON `skus` (`sku_code`);