-- 1) Add columns as nullable first
ALTER TABLE "materials" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "study_groups" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- 2) Backfill materials.slug (readable + id suffix)
UPDATE "materials"
SET "slug" = CONCAT(
  COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE("title", '')), '[^a-z0-9]+', '-', 'g')), ''), 'material'),
  '-',
  RIGHT("id", 6)
)
WHERE "slug" IS NULL;

-- 3) Backfill study_groups.slug (readable + id suffix)
UPDATE "study_groups"
SET "slug" = CONCAT(
  COALESCE(NULLIF(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(COALESCE("name", '')), '[^a-z0-9]+', '-', 'g')), ''), 'group'),
  '-',
  RIGHT("id", 6)
)
WHERE "slug" IS NULL;

-- 4) Enforce constraints
ALTER TABLE "materials" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "study_groups" ALTER COLUMN "slug" SET NOT NULL;

-- 5) Uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "materials_slug_key" ON "materials"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "study_groups_slug_key" ON "study_groups"("slug");
