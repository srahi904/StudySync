/*
  Warnings:

  - You are about to drop the column `isPublic` on the `materials` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MaterialVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'GROUP_ONLY');

-- DropIndex
DROP INDEX "materials_isPublic_idx";

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "isPublic",
ADD COLUMN     "visibility" "MaterialVisibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateTable
CREATE TABLE "material_shares" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "sharedWithUserId" TEXT NOT NULL,
    "sharedByUserId" TEXT NOT NULL,
    "canDownload" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "material_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "material_shares_sharedWithUserId_idx" ON "material_shares"("sharedWithUserId");

-- CreateIndex
CREATE INDEX "material_shares_materialId_idx" ON "material_shares"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "material_shares_materialId_sharedWithUserId_key" ON "material_shares"("materialId", "sharedWithUserId");

-- CreateIndex
CREATE INDEX "materials_visibility_idx" ON "materials"("visibility");

-- AddForeignKey
ALTER TABLE "material_shares" ADD CONSTRAINT "material_shares_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_shares" ADD CONSTRAINT "material_shares_sharedWithUserId_fkey" FOREIGN KEY ("sharedWithUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_shares" ADD CONSTRAINT "material_shares_sharedByUserId_fkey" FOREIGN KEY ("sharedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
