CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`upload_id` integer NOT NULL,
	`date` integer NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`memo` text,
	`bucket` text DEFAULT 'needs_review' NOT NULL,
	`category_id` integer,
	`confidence` integer,
	`is_transfer` integer DEFAULT 0 NOT NULL,
	`is_duplicate` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `transactions_project_id_idx` ON `transactions` (`project_id`);--> statement-breakpoint
CREATE INDEX `transactions_upload_id_idx` ON `transactions` (`upload_id`);--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_bucket_idx` ON `transactions` (`bucket`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`bank_type` text NOT NULL,
	`account_type` text NOT NULL,
	`filename` text NOT NULL,
	`transaction_count` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `uploads_project_id_idx` ON `uploads` (`project_id`);--> statement-breakpoint
CREATE INDEX `uploads_status_idx` ON `uploads` (`status`);