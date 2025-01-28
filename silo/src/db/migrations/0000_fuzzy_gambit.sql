CREATE SCHEMA IF NOT EXISTS "silo";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "silo"."entity_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" varchar(255) NOT NULL,
	"entity_slug" varchar(255) NOT NULL,
	"entity_data" jsonb DEFAULT '{}'::jsonb,
	"project_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"workspace_slug" varchar(255) NOT NULL,
	"workspace_connection_id" uuid NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "silo"."workspace_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"workspace_slug" varchar(255) NOT NULL,
	"target_hostname" varchar(255) NOT NULL,
	"source_hostname" varchar(255),
	"connection_type" varchar(50) NOT NULL,
	"connection_id" varchar(255) NOT NULL,
	"connection_data" jsonb DEFAULT '{}'::jsonb,
	"credentials_id" uuid NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "silo"."credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text,
	"workspace_id" uuid,
	"user_id" uuid,
	"user_email" text,
	"source_access_token" text,
	"source_refresh_token" text,
	"source_hostname" text,
	"target_access_token" text,
	"is_pat" boolean DEFAULT false,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "silo"."job_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "silo"."jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_id" uuid,
	"migration_type" varchar,
	"project_id" uuid,
	"workspace_id" uuid,
	"workspace_slug" text,
	"initiator_id" uuid,
	"initiator_email" text,
	"completed_batch_count" integer DEFAULT 0,
	"transformed_batch_count" integer DEFAULT 0,
	"total_batch_count" integer DEFAULT 0,
	"start_time" timestamp,
	"end_time" timestamp,
	"status" varchar DEFAULT 'CREATED',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"error" text DEFAULT ''
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "silo"."entity_connections" ADD CONSTRAINT "entity_connections_workspace_connection_id_workspace_connections_id_fk" FOREIGN KEY ("workspace_connection_id") REFERENCES "silo"."workspace_connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "silo"."workspace_connections" ADD CONSTRAINT "workspace_connections_credentials_id_credentials_id_fk" FOREIGN KEY ("credentials_id") REFERENCES "silo"."credentials"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "silo"."jobs" ADD CONSTRAINT "jobs_config_id_job_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "silo"."job_configs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "entity_connections_workspace_id_idx" ON "silo"."entity_connections" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_connections_workspace_id_idx" ON "silo"."workspace_connections" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_id_idx" ON "silo"."credentials" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_idx" ON "silo"."jobs" USING btree ("project_id");
