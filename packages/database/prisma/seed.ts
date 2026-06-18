import { PrismaClient } from "@prisma/client";
import {
  seedPermissionsAndRoles,
  seedThemes,
} from "../src/seed-core.js";

// Idempotent baseline seed: permissions, roles and starter themes.
// The admin user, sample pages and active theme are created by the
// browser setup wizard so installs stay configuration-free.
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding permissions and roles...");
  await seedPermissionsAndRoles(prisma);
  console.log("Seeding starter themes...");
  await seedThemes(prisma);
  console.log("Baseline seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
