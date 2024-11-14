CREATE TABLE IF NOT EXISTS "credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text,
	"workspace_id" uuid,
	"user_id" uuid,
	"source_access_token" text,
	"source_refresh_token" text,
	"target_access_token" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meta" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
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
	"target_hostname" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"status" varchar DEFAULT 'INITIATED',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"error" text DEFAULT ''
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_config_id_job_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."job_configs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_id_idx" ON "credentials" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_idx" ON "jobs" USING btree ("project_id");