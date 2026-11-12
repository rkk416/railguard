import { PrismaClient } from "@prisma/client";
import { seedRailGuardData } from "../src/services/seedData";

const prisma = new PrismaClient();

async function main() {
  console.log("=== RailGuard Authoritative Demonstration Seeder ===");
  const summary = await seedRailGuardData(prisma);
  console.log("=== Seeded Record Counts ===");
  console.log(`- Users: ${summary.users}`);
  console.log(`- Stations: ${summary.stations}`);
  console.log(`- Trains: ${summary.trains}`);
  console.log(`- Vendors: ${summary.vendors}`);
  console.log(`- Products: ${summary.products}`);
  console.log(`- Packaging Units: ${summary.packagingUnits}`);
  console.log(`- Complaints: ${summary.complaints}`);
  console.log(`- Investigations: ${summary.investigations}`);
  console.log(`- Corrective Actions: ${summary.correctiveActions}`);
  console.log(`- Recurring Issue Alerts: ${summary.recurringAlerts}`);
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
