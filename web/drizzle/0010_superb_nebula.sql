CREATE TABLE "hosted_model_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"request_kind" text NOT NULL,
	"input_characters" integer DEFAULT 0 NOT NULL,
	"output_characters" integer DEFAULT 0 NOT NULL,
	"cost_micros" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hosted_model_usage" ADD CONSTRAINT "hosted_model_usage_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hosted_model_usage_owner_created_idx" ON "hosted_model_usage" USING btree ("owner_id","created_at");
--> statement-breakpoint
ALTER TABLE "hosted_model_usage" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hosted_model_usage" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hosted_model_usage_tenant_isolation" ON "hosted_model_usage"
  USING ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''))
  WITH CHECK ("owner_id" = nullif(current_setting('rolelinked.owner_id', true), ''));
