/*
  Warnings:

  - You are about to drop the column `created_at` on the `api_types` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `api_types` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `api_types` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "api_keys" ALTER COLUMN "admin_approved" SET DEFAULT false;

-- AlterTable
ALTER TABLE "api_types" DROP COLUMN "created_at",
DROP COLUMN "is_active",
DROP COLUMN "updated_at";
