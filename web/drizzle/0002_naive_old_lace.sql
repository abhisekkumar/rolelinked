ALTER TABLE "resume_versions" DROP CONSTRAINT "resume_versions_resume_id_resumes_id_fk";
--> statement-breakpoint
CREATE UNIQUE INDEX "resumes_id_owner_idx" ON "resumes" USING btree ("id","owner_id");--> statement-breakpoint
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resume_owner_fk" FOREIGN KEY ("resume_id","owner_id") REFERENCES "public"."resumes"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Every hosted query sets rolelinked.owner_id inside its transaction. RLS is a
-- second tenant boundary beneath application-level owner filters.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "users_tenant_isolation" ON "users"
  USING ("id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "candidate_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "candidate_profiles" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "candidate_profiles_tenant_isolation" ON "candidate_profiles"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "search_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "search_profiles" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "search_profiles_tenant_isolation" ON "search_profiles"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "resumes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resumes" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "resumes_tenant_isolation" ON "resumes"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "resume_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resume_versions" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "resume_versions_tenant_isolation" ON "resume_versions"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "documents" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "documents_tenant_isolation" ON "documents"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "account_deletion_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account_deletion_requests" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "account_deletion_requests_tenant_isolation" ON "account_deletion_requests"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));
