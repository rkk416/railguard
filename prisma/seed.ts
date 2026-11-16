import { PrismaClient } from "@prisma/client";
import { seedRailGuardData } from "../src/services/seedData";

// Prioritize direct connection for seeding against Supabase PostgreSQL
const targetUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: targetUrl ? { db: { url: targetUrl } } : undefined,
});

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("=================================================================");
  console.log(`  RailGuard — Operational Dataset Seeder (Dry Run: ${isDryRun})`);
  console.log("=================================================================");

  const summary = await seedRailGuardData(prisma, { dryRun: isDryRun });

  console.log("=================================================================");
  console.log("  Verified Database Record Totals:");
  console.log(`  - Users:                  ${summary.users}`);
  console.log(`  - Stations:               ${summary.stations}`);
  console.log(`  - Trains:                 ${summary.trains}`);
  console.log(`  - Vendors:                ${summary.vendors}`);
  console.log(`  - Products:               ${summary.products}`);
  console.log(`  - Packaging Units:        ${summary.packagingUnits}`);
  console.log(`  - Complaints:             ${summary.complaints}`);
  console.log(`  - Investigations:         ${summary.investigations}`);
  console.log(`  - Corrective Actions:     ${summary.correctiveActions}`);
  console.log(`  - Recurring Issue Alerts: ${summary.recurringAlerts}`);
  console.log("=================================================================");
}

main()
  .catch((e) => {
    console.error("[Seeding Error] Seeding failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
