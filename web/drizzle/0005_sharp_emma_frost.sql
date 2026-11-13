CREATE TABLE "hosted_discovery_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"trigger" text DEFAULT 'manual' NOT NULL,
	"execution" text DEFAULT 'qstash' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"message_id" text,
	"attempt" integer DEFAULT 0 NOT NULL,
	"sources_checked" integer DEFAULT 0 NOT NULL,
	"providers_succeeded" integer DEFAULT 0 NOT NULL,
	"fetched_count" integer DEFAULT 0 NOT NULL,
	"qualified_count" integer DEFAULT 0 NOT NULL,
	"verification_count" integer DEFAULT 0 NOT NULL,
	"rejected_count" integer DEFAULT 0 NOT NULL,
	"saved_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosted_discovery_source_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"run_id" uuid NOT NULL,
	"source" text NOT NULL,
	"status" text NOT NULL,
	"fetched_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hosted_discovery_runs" ADD CONSTRAINT "hosted_discovery_runs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_discovery_source_checks" ADD CONSTRAINT "hosted_discovery_source_checks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_discovery_runs_id_owner_idx" ON "hosted_discovery_runs" USING btree ("id","owner_id");--> statement-breakpoint
ALTER TABLE "hosted_discovery_source_checks" ADD CONSTRAINT "hosted_discovery_source_checks_run_owner_fk" FOREIGN KEY ("run_id","owner_id") REFERENCES "public"."hosted_discovery_runs"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hosted_discovery_runs_owner_created_idx" ON "hosted_discovery_runs" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_discovery_source_checks_run_source_idx" ON "hosted_discovery_source_checks" USING btree ("run_id","source");--> statement-breakpoint
CREATE INDEX "hosted_discovery_source_checks_owner_run_idx" ON "hosted_discovery_source_checks" USING btree ("owner_id","run_id");--> statement-breakpoint

-- Discovery telemetry is account-private and uses the same forced RLS boundary
-- as profiles, resumes, jobs, and status history.
ALTER TABLE "hosted_discovery_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_discovery_runs" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_discovery_runs_tenant_isolation" ON "hosted_discovery_runs"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "hosted_discovery_source_checks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_discovery_source_checks" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_discovery_source_checks_tenant_isolation" ON "hosted_discovery_source_checks"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));
