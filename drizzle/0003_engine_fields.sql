ALTER TABLE `cars` ADD `engine_type` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cars` ADD `engine_cc` integer;--> statement-breakpoint
ALTER TABLE `cars` ADD `power` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cars` ADD `torque` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cars` ADD `mileage` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cars` ADD `drivetrain` text DEFAULT '' NOT NULL;