-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('PDF', 'DOCUMENT', 'PRESENTATION', 'SPREADSHEET', 'IMAGE', 'VIDEO', 'AUDIO', 'TEXT', 'OTHER');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'FAILED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "coverPhoto" TEXT,
ADD COLUMN     "currentYear" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "preferredStudyTime" TEXT,
ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "studyGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "twitterUrl" TEXT,
ADD COLUMN     "websiteUrl" TEXT;

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MaterialType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "status" "MaterialStatus" NOT NULL DEFAULT 'PENDING',
    "embeddings" JSONB,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "materials_userId_idx" ON "materials"("userId");

-- CreateIndex
CREATE INDEX "materials_subject_idx" ON "materials"("subject");

-- CreateIndex
CREATE INDEX "materials_status_idx" ON "materials"("status");

-- CreateIndex
CREATE INDEX "materials_isPublic_idx" ON "materials"("isPublic");

-- CreateIndex
CREATE INDEX "materials_createdAt_idx" ON "materials"("createdAt");

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
