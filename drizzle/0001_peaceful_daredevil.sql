CREATE TYPE "public"."classification_label" AS ENUM('baik', 'buruk', 'netral');--> statement-breakpoint
CREATE TYPE "public"."model_status" AS ENUM('training', 'ready', 'failed', 'retired');--> statement-breakpoint
CREATE TABLE "ml_evaluation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"status" text NOT NULL,
	"random_seed" integer NOT NULL,
	"test_size" text NOT NULL,
	"cross_validation_folds" integer NOT NULL,
	"accuracy" text,
	"macro_precision" text,
	"macro_recall" text,
	"macro_f1" text,
	"weighted_f1" text,
	"confusion_matrix" jsonb,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ml_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"algorithm" text DEFAULT 'linear_svm' NOT NULL,
	"status" "model_status" NOT NULL,
	"artifact_name" text,
	"training_sample_count" integer,
	"test_sample_count" integer,
	"class_distribution" jsonb,
	"metrics" jsonb,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ml_models_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "news_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" uuid NOT NULL,
	"label" "classification_label" NOT NULL,
	"labeled_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"news_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"label" "classification_label" NOT NULL,
	"confidence" text NOT NULL,
	"scores" jsonb,
	"predicted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ml_evaluation_runs" ADD CONSTRAINT "ml_evaluation_runs_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ml_models" ADD CONSTRAINT "ml_models_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "news_labels" ADD CONSTRAINT "news_labels_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "news_labels" ADD CONSTRAINT "news_labels_labeled_by_users_id_fk" FOREIGN KEY ("labeled_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "news_predictions" ADD CONSTRAINT "news_predictions_news_id_news_id_fk" FOREIGN KEY ("news_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "news_predictions" ADD CONSTRAINT "news_predictions_model_id_ml_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ml_models"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "ml_evaluation_runs_model_id_idx" ON "ml_evaluation_runs" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "ml_models_status_idx" ON "ml_models" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ml_models_active_idx" ON "ml_models" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "news_labels_news_id_idx" ON "news_labels" USING btree ("news_id");--> statement-breakpoint
CREATE INDEX "news_predictions_news_id_predicted_at_idx" ON "news_predictions" USING btree ("news_id","predicted_at");--> statement-breakpoint
CREATE INDEX "news_predictions_model_id_predicted_at_idx" ON "news_predictions" USING btree ("model_id","predicted_at");