ALTER TABLE "silo"."entity_connections" ALTER COLUMN "entity_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "silo"."entity_connections" ALTER COLUMN "entity_slug" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "silo"."entity_connections" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "silo"."entity_connections" ADD COLUMN "connection_type" varchar(50) DEFAULT 'ENTITY';