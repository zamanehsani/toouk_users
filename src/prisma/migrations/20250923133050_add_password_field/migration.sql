-- AlterTable
ALTER TABLE "public"."Users" ADD COLUMN     "password" TEXT;

-- Update existing users with a default hashed password (SHA-256 of "defaultpassword")
UPDATE "public"."Users" SET "password" = 'e3c1d5c5d1f5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5c5' WHERE "password" IS NULL;

-- Make password field required
ALTER TABLE "public"."Users" ALTER COLUMN "password" SET NOT NULL;