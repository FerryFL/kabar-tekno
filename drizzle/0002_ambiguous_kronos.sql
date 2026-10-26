ALTER TABLE "news" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "news_is_archived_idx" ON "news" USING btree ("is_archived");