/** @format */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Emptying old mismatched vector records...");
  await prisma.$executeRawUnsafe("DELETE FROM material_chunks");

  console.log("Altering vector type on material_chunks to 3072 dimensions...");
  await prisma.$executeRawUnsafe(
    "ALTER TABLE material_chunks ALTER COLUMN embedding TYPE vector(3072)",
  );

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
