CREATE TABLE `checklist_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`stage` enum('pre-listing-appointment','post-listing-appointment','signed-listing-agreement','marketing-prep','active-on-market','review-and-responses','in-escrow','post-close') NOT NULL,
	`title` varchar(500) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`itemStatus` enum('pending','in-progress','completed') NOT NULL DEFAULT 'pending',
	`dateCompleted` timestamp,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklist_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`listingId` int,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientPhone` varchar(32),
	`inviteToken` varchar(128) NOT NULL,
	`inviteStatus` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
	`acceptedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `client_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_invitations_inviteToken_unique` UNIQUE(`inviteToken`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(255),
	`clientEmail` varchar(320),
	`clientPhone` varchar(32),
	`address` varchar(500) NOT NULL,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(10),
	`bedrooms` int,
	`bathrooms` decimal(3,1),
	`sqft` int,
	`lotSizeSqft` int,
	`yearBuilt` int,
	`propertyType` varchar(50),
	`listPrice` decimal(12,2),
	`mlsNumber` varchar(50),
	`listingStatus` enum('pre-listing','coming-soon','active','under-contract','sold','withdrawn','expired') NOT NULL DEFAULT 'pre-listing',
	`listDate` timestamp,
	`closeDate` timestamp,
	`salePrice` decimal(12,2),
	`description` text,
	`photoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`category` enum('Marketing Calendar','Google Drive Folder','Photos Folder','Video','Matterport','Property Website') NOT NULL,
	`url` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketing_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`agentName` varchar(255),
	`company` varchar(255),
	`buyerName` varchar(255),
	`offerPrice` decimal(12,2),
	`escrowPeriod` varchar(100),
	`emdAmount` decimal(12,2),
	`emdPercent` decimal(5,2),
	`loanType` varchar(100),
	`downPayment` decimal(12,2),
	`loanPercent` decimal(5,2),
	`loanAmount` decimal(12,2),
	`preapprovalLetter` enum('Yes','No','Pending') DEFAULT 'No',
	`proofOfFunds` enum('Yes','No','Pending') DEFAULT 'No',
	`inspectionContingency` varchar(100),
	`appraisalContingency` varchar(100),
	`loanContingency` varchar(100),
	`escrowCompany` varchar(255),
	`titleCompany` varchar(255),
	`homeWarrantyCompany` varchar(255),
	`homeWarrantyAmount` decimal(10,2),
	`homeToSell` enum('Yes','No') DEFAULT 'No',
	`notes` text,
	`offerStatus` enum('pending','accepted','countered','rejected','withdrawn') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`redfin_views` int DEFAULT 0,
	`zillow_views` int DEFAULT 0,
	`redfin_saves` int DEFAULT 0,
	`zillow_saves` int DEFAULT 0,
	`totalShowings` int DEFAULT 0,
	`totalOffers` int DEFAULT 0,
	`openHouseDates` json,
	`priceHistory` json,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `property_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `showings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`showingDate` timestamp NOT NULL,
	`agentName` varchar(255),
	`brokerage` varchar(255),
	`interestLevel` enum('Not Responsive','No Interest','Low','High'),
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `showings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `portalRole` enum('agent','client') DEFAULT 'agent' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `invitedByAgentId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);