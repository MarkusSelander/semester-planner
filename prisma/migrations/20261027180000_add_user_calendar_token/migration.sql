ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "calendarToken" TEXT;
UPDATE "users" SET "calendarToken" = gen_random_uuid()::text WHERE "calendarToken" IS NULL;
ALTER TABLE "users" ALTER COLUMN "calendarToken" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "users" ALTER COLUMN "calendarToken" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_calendarToken_key" ON "users" ("calendarToken");
