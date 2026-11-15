CREATE TABLE "hosted_application_packet_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"packet_id" uuid NOT NULL,
	"event" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosted_application_packets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"resume_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"source_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"review_notes" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosted_automation_schedules" (
	"owner_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"cadence" text DEFAULT 'daily' NOT NULL,
	"local_time" text DEFAULT '09:00' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"qstash_schedule_id" text,
	"next_run_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosted_source_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"source_key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "original_filename" text DEFAULT 'document' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "sha256" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "source" text DEFAULT 'upload' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_application_packets_id_owner_idx" ON "hosted_application_packets" USING btree ("id","owner_id");--> statement-breakpoint
ALTER TABLE "hosted_application_packet_events" ADD CONSTRAINT "hosted_application_packet_events_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_application_packet_events" ADD CONSTRAINT "hosted_application_packet_events_packet_owner_fk" FOREIGN KEY ("packet_id","owner_id") REFERENCES "public"."hosted_application_packets"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD CONSTRAINT "hosted_application_packets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD CONSTRAINT "hosted_application_packets_job_owner_fk" FOREIGN KEY ("job_id","owner_id") REFERENCES "public"."hosted_jobs"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD CONSTRAINT "hosted_application_packets_resume_owner_fk" FOREIGN KEY ("resume_id","owner_id") REFERENCES "public"."resumes"("id","owner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_automation_schedules" ADD CONSTRAINT "hosted_automation_schedules_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_source_preferences" ADD CONSTRAINT "hosted_source_preferences_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hosted_application_packet_events_owner_packet_idx" ON "hosted_application_packet_events" USING btree ("owner_id","packet_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_application_packets_owner_job_idx" ON "hosted_application_packets" USING btree ("owner_id","job_id");--> statement-breakpoint
CREATE INDEX "hosted_application_packets_owner_status_idx" ON "hosted_application_packets" USING btree ("owner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_source_preferences_owner_source_idx" ON "hosted_source_preferences" USING btree ("owner_id","source_key");--> statement-breakpoint
CREATE INDEX "hosted_source_preferences_owner_idx" ON "hosted_source_preferences" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_id_owner_idx" ON "documents" USING btree ("id","owner_id");
--> statement-breakpoint

-- Phase 4 career-operation records are tenant-private. FORCE prevents the
-- database owner from bypassing the policy during ordinary application use.
ALTER TABLE "hosted_application_packets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_application_packets" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_application_packets_tenant_isolation" ON "hosted_application_packets"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "hosted_application_packet_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_application_packet_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_application_packet_events_tenant_isolation" ON "hosted_application_packet_events"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "hosted_automation_schedules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_automation_schedules" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_automation_schedules_tenant_isolation" ON "hosted_automation_schedules"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "hosted_source_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_source_preferences" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_source_preferences_tenant_isolation" ON "hosted_source_preferences"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));
