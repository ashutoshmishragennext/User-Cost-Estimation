CREATE TABLE IF NOT EXISTS "project_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_assignments" ADD CONSTRAINT "project_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "project_user_unique_idx" ON "project_assignments" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_assignment_project_idx" ON "project_assignments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_assignment_user_idx" ON "project_assignments" USING btree ("user_id");