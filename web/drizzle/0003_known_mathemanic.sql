CREATE TABLE "hosted_job_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"from_status" text NOT NULL,
	"to_status" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosted_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"source" text NOT NULL,
	"source_job_id" text,
	"url" text NOT NULL,
	"canonical_url" text NOT NULL,
	"company" text NOT NULL,
	"title" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"description_excerpt" text DEFAULT '' NOT NULL,
	"posted_at" timestamp with time zone,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"match_score" integer,
	"match_reasons" text[] DEFAULT '{}'::text[] NOT NULL,
	"matched_skills" text[] DEFAULT '{}'::text[] NOT NULL,
	"remote_signal" text DEFAULT 'unknown' NOT NULL,
	"sponsorship_signal" text DEFAULT 'unknown' NOT NULL,
	"compensation_minimum" integer,
	"compensation_maximum" integer,
	"status" text DEFAULT 'discovered' NOT NULL,
	"status_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hosted_job_status_events" ADD CONSTRAINT "hosted_job_status_events_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_job_status_events" ADD CONSTRAINT "hosted_job_status_events_job_owner_fk" FOREIGN KEY ("job_id","owner_id") REFERENCES "public"."hosted_jobs"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_jobs" ADD CONSTRAINT "hosted_jobs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hosted_job_status_events_owner_job_idx" ON "hosted_job_status_events" USING btree ("owner_id","job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_jobs_owner_canonical_url_idx" ON "hosted_jobs" USING btree ("owner_id","canonical_url");--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_jobs_id_owner_idx" ON "hosted_jobs" USING btree ("id","owner_id");--> statement-breakpoint
CREATE INDEX "hosted_jobs_owner_status_idx" ON "hosted_jobs" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "hosted_jobs_owner_discovered_idx" ON "hosted_jobs" USING btree ("owner_id","discovered_at");
--> statement-breakpoint

-- Hosted discovery and pipeline records use the same forced RLS tenant
-- boundary as the Phase 2 profile and resume tables.
ALTER TABLE "hosted_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_jobs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_jobs_tenant_isolation" ON "hosted_jobs"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "hosted_job_status_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_job_status_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_job_status_events_tenant_isolation" ON "hosted_job_status_events"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));
