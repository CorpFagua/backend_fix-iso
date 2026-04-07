/*
  Warnings:

  - You are about to drop the column `company_id` on the `trainings` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `trainings` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `trainings` table. All the data in the column will be lost.
  - You are about to drop the column `trainer_id` on the `trainings` table. All the data in the column will be lost.
  - You are about to drop the `training_attendees` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `created_by` to the `trainings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `trainings` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `training_type` on the `trainings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('ORGANIZATIONAL', 'PEOPLE', 'PHYSICAL', 'TECHNOLOGICAL', 'PROCESS');

-- DropForeignKey
ALTER TABLE "training_attendees" DROP CONSTRAINT "training_attendees_training_id_fkey";

-- DropForeignKey
ALTER TABLE "trainings" DROP CONSTRAINT "trainings_company_id_fkey";

-- DropForeignKey
ALTER TABLE "trainings" DROP CONSTRAINT "trainings_trainer_id_fkey";

-- DropIndex
DROP INDEX "trainings_company_id_idx";

-- AlterTable
ALTER TABLE "trainings" DROP COLUMN "company_id",
DROP COLUMN "date",
DROP COLUMN "status",
DROP COLUMN "trainer_id",
ADD COLUMN     "created_by" INTEGER NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "resources_json" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "training_type",
ADD COLUMN     "training_type" "TrainingType" NOT NULL;

-- DropTable
DROP TABLE "training_attendees";

-- CreateTable
CREATE TABLE "company_trainings" (
    "id" SERIAL NOT NULL,
    "training_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "assigned_by" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_user_enrollments" (
    "id" SERIAL NOT NULL,
    "company_training_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "training_user_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_trainings_company_id_idx" ON "company_trainings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_trainings_training_id_company_id_key" ON "company_trainings"("training_id", "company_id");

-- CreateIndex
CREATE INDEX "training_user_enrollments_user_id_idx" ON "training_user_enrollments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_user_enrollments_company_training_id_user_id_key" ON "training_user_enrollments"("company_training_id", "user_id");

-- CreateIndex
CREATE INDEX "trainings_created_by_idx" ON "trainings"("created_by");

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_trainings" ADD CONSTRAINT "company_trainings_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_trainings" ADD CONSTRAINT "company_trainings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_trainings" ADD CONSTRAINT "company_trainings_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_user_enrollments" ADD CONSTRAINT "training_user_enrollments_company_training_id_fkey" FOREIGN KEY ("company_training_id") REFERENCES "company_trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_user_enrollments" ADD CONSTRAINT "training_user_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
