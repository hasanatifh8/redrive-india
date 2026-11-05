CREATE TABLE `car_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`car_id` integer NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`car_id`) REFERENCES `cars`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `car_images_car_idx` ON `car_images` (`car_id`);--> statement-breakpoint
CREATE TABLE `cars` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`variant` text DEFAULT '' NOT NULL,
	`year` integer NOT NULL,
	`km` integer DEFAULT 0 NOT NULL,
	`fuel` text NOT NULL,
	`transmission` text NOT NULL,
	`body_type` text DEFAULT 'SUV' NOT NULL,
	`owner` text DEFAULT '1st Owner' NOT NULL,
	`color` text DEFAULT '' NOT NULL,
	`seats` integer,
	`registration` text DEFAULT '' NOT NULL,
	`insurance_validity` text DEFAULT '' NOT NULL,
	`price` integer NOT NULL,
	`discount_type` text DEFAULT 'none' NOT NULL,
	`discount_value` integer DEFAULT 0 NOT NULL,
	`discount_label` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`new_arrival` integer DEFAULT false NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`features` text DEFAULT '[]' NOT NULL,
	`inspection` text DEFAULT '[]' NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`sold_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cars_slug_idx` ON `cars` (`slug`);--> statement-breakpoint
CREATE INDEX `cars_status_idx` ON `cars` (`status`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`car_id` integer,
	`car_label` text DEFAULT '' NOT NULL,
	`referral_code` text,
	`details` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`reward_paid` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`car_id`) REFERENCES `cars`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `leads_created_idx` ON `leads` (`created_at`);--> statement-breakpoint
CREATE TABLE `offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image` text,
	`car_id` integer,
	`cta_label` text DEFAULT '' NOT NULL,
	`cta_href` text DEFAULT '' NOT NULL,
	`valid_until` integer,
	`active` integer DEFAULT true NOT NULL,
	`show_on_home` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`car_id`) REFERENCES `cars`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `referral_codes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`discount_type` text DEFAULT 'flat' NOT NULL,
	`discount_value` integer DEFAULT 0 NOT NULL,
	`max_discount` integer,
	`referrer_name` text DEFAULT '' NOT NULL,
	`referrer_phone` text DEFAULT '' NOT NULL,
	`reward_amount` integer DEFAULT 0 NOT NULL,
	`max_uses` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referral_code_idx` ON `referral_codes` (`code`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
