ALTER TABLE `offers` ADD `category` text DEFAULT 'car' NOT NULL;--> statement-breakpoint
ALTER TABLE `offers` ADD `icon` text DEFAULT 'gift' NOT NULL;--> statement-breakpoint
ALTER TABLE `offers` ADD `highlight` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `offers` ADD `terms` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `offers` ADD `claimable` integer DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE `offers` SET `category` = 'showroom' WHERE `car_id` IS NULL;