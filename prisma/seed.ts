import { PrismaClient, UserRole, VendorStatus, ProductCategory, PackagingStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting RailGuard demonstration data seeding...");

  // 1. Seed Authorized Users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@railguard.test" },
    update: {},
    create: {
      email: "admin@railguard.test",
      name: "Admin S. Verma (Demonstration)",
      passwordHash: "$2a$12$demoAdminHashPlaceholderForDevelopment1234567890",
      role: UserRole.ADMIN,
    },
  });

  const reviewerUser = await prisma.user.upsert({
    where: { email: "reviewer@railguard.test" },
    update: {},
    create: {
      email: "reviewer@railguard.test",
      name: "Inspector R. Sharma (Demonstration)",
      passwordHash: "$2a$12$demoReviewerHashPlaceholderForDevelopment1234567890",
      role: UserRole.QUALITY_REVIEWER,
    },
  });

  console.log(`Seeded users: ${adminUser.email}, ${reviewerUser.email}`);

  // 2. Seed Demonstration Vendors
  const vendorNorth = await prisma.vendor.upsert({
    where: { code: "VND-NR-001" },
    update: {},
    create: {
      name: "Northern Rail Caterers Pvt Ltd (Demo)",
      code: "VND-NR-001",
      contactEmail: "quality@northernrailcaterers.test",
      contactPhone: "+91-11-23344550",
      licenseNumber: "FSSAI-100239990001",
      status: VendorStatus.ACTIVE,
    },
  });

  const vendorWest = await prisma.vendor.upsert({
    where: { code: "VND-WR-002" },
    update: {},
    create: {
      name: "Western Express Pantry Services (Demo)",
      code: "VND-WR-002",
      contactEmail: "audit@westernpantry.test",
      contactPhone: "+91-22-24455660",
      licenseNumber: "FSSAI-100239990002",
      status: VendorStatus.ACTIVE,
    },
  });

  const vendorDeccan = await prisma.vendor.upsert({
    where: { code: "VND-SR-003" },
    update: {},
    create: {
      name: "Deccan Base Kitchen Operators (Demo)",
      code: "VND-SR-003",
      contactEmail: "compliance@deccanbasekitchens.test",
      contactPhone: "+91-44-25566770",
      licenseNumber: "FSSAI-100239990003",
      status: VendorStatus.UNDER_REVIEW,
    },
  });

  console.log("Seeded 3 demonstration vendors.");

  // 3. Seed Demonstration Products
  // Clean or upsert products
  const productThali = await prisma.product.create({
    data: {
      vendorId: vendorNorth.id,
      name: "Standard Vegetarian Thali (Demo)",
      category: ProductCategory.MEAL_TRAY,
      fssaiLicense: "FSSAI-100239990001",
      standardPrice: 120.0,
      shelfLifeHours: 12,
    },
  });

  const productWater = await prisma.product.create({
    data: {
      vendorId: vendorNorth.id,
      name: "Rail Neer Packaged Water 1L (Demo)",
      category: ProductCategory.PACKAGED_WATER,
      fssaiLicense: "FSSAI-100239990001",
      standardPrice: 15.0,
      shelfLifeHours: 720,
    },
  });

  const productBreakfast = await prisma.product.create({
    data: {
      vendorId: vendorWest.id,
      name: "Idli Vada Breakfast Combo (Demo)",
      category: ProductCategory.MEAL_TRAY,
      fssaiLicense: "FSSAI-100239990002",
      standardPrice: 80.0,
      shelfLifeHours: 8,
    },
  });

  const productBiryani = await prisma.product.create({
    data: {
      vendorId: vendorDeccan.id,
      name: "Pantry Veg Biryani Casserole (Demo)",
      category: ProductCategory.MEAL_TRAY,
      fssaiLicense: "FSSAI-100239990003",
      standardPrice: 110.0,
      shelfLifeHours: 10,
    },
  });

  console.log("Seeded 4 demonstration products.");

  // 4. Seed Packaging Units with Testable Scenarios
  const now = new Date();
  const futureExpiry = new Date(now.getTime() + 12 * 60 * 60 * 1000); // +12 hours
  const pastExpiry = new Date(now.getTime() - 24 * 60 * 60 * 1000); // -24 hours

  // A. Active Valid Thali
  await prisma.packagingUnit.upsert({
    where: { qrCodeIdentifier: "DEMO-THALI-ACTIVE-001" },
    update: {},
    create: {
      productId: productThali.id,
      batchNumber: "BATCH-NR-2026-04A",
      packagingDate: now,
      expiryDate: futureExpiry,
      qrCodeIdentifier: "DEMO-THALI-ACTIVE-001",
      status: PackagingStatus.ACTIVE,
    },
  });

  // B. Active Valid Water
  await prisma.packagingUnit.upsert({
    where: { qrCodeIdentifier: "DEMO-WATER-ACTIVE-002" },
    update: {},
    create: {
      productId: productWater.id,
      batchNumber: "BATCH-RN-2026-880",
      packagingDate: now,
      expiryDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
      qrCodeIdentifier: "DEMO-WATER-ACTIVE-002",
      status: PackagingStatus.ACTIVE,
    },
  });

  // C. Expired Breakfast Unit
  await prisma.packagingUnit.upsert({
    where: { qrCodeIdentifier: "DEMO-BREAKFAST-EXPIRED-003" },
    update: {},
    create: {
      productId: productBreakfast.id,
      batchNumber: "BATCH-WR-2026-EXP",
      packagingDate: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      expiryDate: pastExpiry,
      qrCodeIdentifier: "DEMO-BREAKFAST-EXPIRED-003",
      status: PackagingStatus.EXPIRED,
    },
  });

  // D. Recalled Biryani Unit
  await prisma.packagingUnit.upsert({
    where: { qrCodeIdentifier: "DEMO-BIRYANI-RECALLED-004" },
    update: {},
    create: {
      productId: productBiryani.id,
      batchNumber: "BATCH-SR-2026-RECALL-9",
      packagingDate: now,
      expiryDate: futureExpiry,
      qrCodeIdentifier: "DEMO-BIRYANI-RECALLED-004",
      status: PackagingStatus.RECALLED,
    },
  });

  console.log("Seeded 4 demonstration packaging batches.");
  console.log("Demonstration seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
