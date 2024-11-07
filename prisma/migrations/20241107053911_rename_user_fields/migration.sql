-- First, create the new column allowing NULL temporarily
ALTER TABLE "api_keys" ADD COLUMN "user_token" TEXT;

-- Copy data from user_id to user_token
UPDATE "api_keys" SET "user_token" = "user_id";

-- Make user_token required
ALTER TABLE "api_keys" ALTER COLUMN "user_token" SET NOT NULL;

-- Drop the old column
ALTER TABLE "api_keys" DROP COLUMN "user_id";

-- Rename is_active to admin_approved
ALTER TABLE "api_keys" RENAME COLUMN "is_active" TO "admin_approved";

-- Recreate the unique constraint with the new column name
ALTER TABLE "api_keys" DROP CONSTRAINT IF EXISTS "api_keys_user_id_api_type_id_key";
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_token_api_type_id_key" UNIQUE ("user_token", "api_type_id");