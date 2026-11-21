CREATE TABLE "hosted_artifact_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"artifact_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"source_job_id" uuid,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"evidence_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"change_summary" text DEFAULT '' NOT NULL,
	"restored_from_version_id" uuid,
	"content_sha256" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosted_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"role_family" text DEFAULT '' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hosted_artifacts_kind_check" CHECK ("hosted_artifacts"."kind" in ('resume', 'cover-letter'))
);
--> statement-breakpoint
ALTER TABLE "hosted_artifact_versions" ADD CONSTRAINT "hosted_artifact_versions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_artifacts_id_owner_idx" ON "hosted_artifacts" USING btree ("id","owner_id");--> statement-breakpoint
ALTER TABLE "hosted_artifact_versions" ADD CONSTRAINT "hosted_artifact_versions_artifact_owner_fk" FOREIGN KEY ("artifact_id","owner_id") REFERENCES "public"."hosted_artifacts"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_artifacts" ADD CONSTRAINT "hosted_artifacts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_artifact_versions_artifact_version_idx" ON "hosted_artifact_versions" USING btree ("artifact_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_artifact_versions_id_owner_idx" ON "hosted_artifact_versions" USING btree ("id","owner_id");--> statement-breakpoint
CREATE INDEX "hosted_artifact_versions_owner_artifact_idx" ON "hosted_artifact_versions" USING btree ("owner_id","artifact_id");--> statement-breakpoint
CREATE INDEX "hosted_artifacts_owner_kind_idx" ON "hosted_artifacts" USING btree ("owner_id","kind");
--> statement-breakpoint
ALTER TABLE "hosted_artifacts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hosted_artifacts" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hosted_artifacts_tenant_isolation" ON "hosted_artifacts"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));
--> statement-breakpoint
ALTER TABLE "hosted_artifact_versions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hosted_artifact_versions" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hosted_artifact_versions_tenant_isolation" ON "hosted_artifact_versions"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));
