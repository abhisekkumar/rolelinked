CREATE TABLE "hosted_evidence_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"evidence_id" uuid NOT NULL,
	"event" text NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosted_evidence_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"verification_state" text DEFAULT 'derived-unverified' NOT NULL,
	"source_type" text NOT NULL,
	"source_resume_id" uuid,
	"source_document_id" uuid,
	"source_label" text NOT NULL,
	"source_excerpt" text NOT NULL,
	"is_quantified" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hosted_evidence_items_verification_state_check" CHECK ("hosted_evidence_items"."verification_state" in ('verified', 'corrected', 'narrative-only', 'unknown', 'derived-unverified', 'user-cannot-confirm')),
	CONSTRAINT "hosted_evidence_items_source_type_check" CHECK ("hosted_evidence_items"."source_type" in ('resume', 'document', 'user-statement', 'manual-confirmation')),
	CONSTRAINT "hosted_evidence_items_source_reference_check" CHECK ((
        ("hosted_evidence_items"."source_type" = 'resume' and "hosted_evidence_items"."source_resume_id" is not null and "hosted_evidence_items"."source_document_id" is null)
        or ("hosted_evidence_items"."source_type" = 'document' and "hosted_evidence_items"."source_document_id" is not null and "hosted_evidence_items"."source_resume_id" is null)
        or ("hosted_evidence_items"."source_type" in ('user-statement', 'manual-confirmation') and "hosted_evidence_items"."source_resume_id" is null and "hosted_evidence_items"."source_document_id" is null)
      ))
);
--> statement-breakpoint
CREATE TABLE "hosted_evidence_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"evidence_id" uuid NOT NULL,
	"surface_type" text NOT NULL,
	"surface_id" text NOT NULL,
	"surface_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_evidence_items_id_owner_idx" ON "hosted_evidence_items" USING btree ("id","owner_id");--> statement-breakpoint
ALTER TABLE "hosted_evidence_events" ADD CONSTRAINT "hosted_evidence_events_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_evidence_events" ADD CONSTRAINT "hosted_evidence_events_item_owner_fk" FOREIGN KEY ("evidence_id","owner_id") REFERENCES "public"."hosted_evidence_items"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_evidence_items" ADD CONSTRAINT "hosted_evidence_items_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_evidence_items" ADD CONSTRAINT "hosted_evidence_items_resume_owner_fk" FOREIGN KEY ("source_resume_id","owner_id") REFERENCES "public"."resumes"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_evidence_items" ADD CONSTRAINT "hosted_evidence_items_document_owner_fk" FOREIGN KEY ("source_document_id","owner_id") REFERENCES "public"."documents"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_evidence_usages" ADD CONSTRAINT "hosted_evidence_usages_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosted_evidence_usages" ADD CONSTRAINT "hosted_evidence_usages_item_owner_fk" FOREIGN KEY ("evidence_id","owner_id") REFERENCES "public"."hosted_evidence_items"("id","owner_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hosted_evidence_events_owner_item_idx" ON "hosted_evidence_events" USING btree ("owner_id","evidence_id");--> statement-breakpoint
CREATE INDEX "hosted_evidence_items_owner_state_idx" ON "hosted_evidence_items" USING btree ("owner_id","verification_state");--> statement-breakpoint
CREATE INDEX "hosted_evidence_items_owner_category_idx" ON "hosted_evidence_items" USING btree ("owner_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "hosted_evidence_usages_owner_surface_idx" ON "hosted_evidence_usages" USING btree ("owner_id","evidence_id","surface_type","surface_id");--> statement-breakpoint

-- Defense in depth: every hosted query also scopes by owner_id, while forced
-- row-level security protects the tables if a future query forgets that filter.
ALTER TABLE "hosted_evidence_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_evidence_items" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_evidence_items_tenant_isolation" ON "hosted_evidence_items"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "hosted_evidence_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_evidence_events" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_evidence_events_tenant_isolation" ON "hosted_evidence_events"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));--> statement-breakpoint

ALTER TABLE "hosted_evidence_usages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hosted_evidence_usages" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "hosted_evidence_usages_tenant_isolation" ON "hosted_evidence_usages"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));
