CREATE TYPE "public"."reading_status" AS ENUM('por-leer', 'leyendo', 'leido');--> statement-breakpoint
CREATE TABLE "library_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"olid" text NOT NULL,
	"isbn" text,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"cover_url" text,
	"first_publish_year" integer,
	"status" "reading_status" DEFAULT 'por-leer' NOT NULL,
	"user_rating" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "library_books_user_olid_unique" ON "library_books" USING btree ("user_id","olid");--> statement-breakpoint
CREATE UNIQUE INDEX "library_books_user_isbn_unique" ON "library_books" USING btree ("user_id","isbn");