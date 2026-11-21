CREATE TABLE "hosted_ats_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"resume_id" uuid NOT NULL,
	"resume_version_id" uuid NOT NULL,
	"analysis" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"job_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resume_sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD COLUMN "resume_artifact_version_id" uuid;--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD COLUMN "cover_letter_version_id" uuid;--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD COLUMN "ats_report_id" uuid;--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD COLUMN "approval_fingerprint" text;--> statement-breakpoint
ALTER TABLE "hosted_ats_reports" ADD CONSTRAINT "hosted_ats_reports_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_ats_reports" ADD CONSTRAINT "hosted_ats_reports_job_owner_fk" FOREIGN KEY ("job_id","owner_id") REFERENCES "public"."hosted_jobs"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_ats_reports" ADD CONSTRAINT "hosted_ats_reports_resume_owner_fk" FOREIGN KEY ("resume_id","owner_id") REFERENCES "public"."resumes"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_ats_reports_id_owner_idx" ON "hosted_ats_reports" USING btree ("id","owner_id");--> statement-breakpoint
CREATE INDEX "hosted_ats_reports_owner_job_idx" ON "hosted_ats_reports" USING btree ("owner_id","job_id");--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD CONSTRAINT "hosted_application_packets_resume_artifact_owner_fk" FOREIGN KEY ("resume_artifact_version_id","owner_id") REFERENCES "public"."hosted_artifact_versions"("id","owner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD CONSTRAINT "hosted_application_packets_cover_letter_owner_fk" FOREIGN KEY ("cover_letter_version_id","owner_id") REFERENCES "public"."hosted_artifact_versions"("id","owner_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_application_packets" ADD CONSTRAINT "hosted_application_packets_ats_report_owner_fk" FOREIGN KEY ("ats_report_id","owner_id") REFERENCES "public"."hosted_ats_reports"("id","owner_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hosted_ats_reports" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hosted_ats_reports" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hosted_ats_reports_tenant_isolation" ON "hosted_ats_reports"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));
