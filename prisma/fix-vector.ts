/** @format */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting old records...");
  await prisma.$executeRawUnsafe("DELETE FROM material_chunks");

  console.log(
    "Altering column to vector(3072) to match gemini-embedding-001...",
  );
  await prisma.$executeRawUnsafe(
    "ALTER TABLE material_chunks ALTER COLUMN embedding TYPE vector(3072)",
  );

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
