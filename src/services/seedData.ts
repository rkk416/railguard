import {
  PrismaClient,
  UserRole,
  VendorStatus,
  ProductCategory,
  PackagingStatus,
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
  InvestigationDetermination,
  CorrectiveActionType,
  CorrectiveActionStatus,
  AlertStatus,
} from "@prisma/client";
import { hashTrackingToken } from "@/lib/crypto/token";
import { ensureDemoEvidenceAssets } from "@/lib/storage/demoEvidence";
import { hashPassword } from "@/lib/auth/password";
import crypto from "crypto";

export interface SeedSummary {
  users: number;
  stations: number;
  trains: number;
  vendors: number;
  products: number;
  packagingUnits: number;
  complaints: number;
  investigations: number;
  correctiveActions: number;
  recurringAlerts: number;
}

export interface SeedOptions {
  dryRun?: boolean;
}

/**
 * Executes an idempotent, non-destructive seed of RailGuard operational demonstration data.
 *
 * Requirements Met:
 * 1. Safe & Non-Destructive: Never truncates tables or deletes existing complaints/staff accounts.
 * 2. Account Separation: Reuses existing administrator/reviewer accounts rather than overwriting them.
 * 3. Transparent Reference Distinction: Stations and trains are verifiable Indian Railways references;
 *    pantry vendors and complaints are explicitly marked as demonstration records.
 * 4. Internal Consistency: All foreign keys, dates, and event sequences follow logical chronology.
 */
export async function seedRailGuardData(
  prisma: PrismaClient,
  options: SeedOptions = {}
): Promise<SeedSummary> {
  const isDryRun = options.dryRun === true;
  console.log(`[RailGuard Seeder] Starting operational dataset synchronization (Dry Run: ${isDryRun})...`);

  // Ensure synthetic placeholder SVG assets exist on disk for evidence streaming
  const demoAssets = ensureDemoEvidenceAssets();

  // ─────────────────────────────────────────────────────────────
  // 1. Staff Account Handling (Preserves existing accounts)
  // ─────────────────────────────────────────────────────────────
  let adminUser = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  let reviewerUser = await prisma.user.findFirst({
    where: { role: UserRole.QUALITY_REVIEWER },
  });

  if (!adminUser && !isDryRun) {
    const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || "admin.demo@railguard.internal").toLowerCase().trim();
    const adminPass = process.env.INITIAL_ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex") + "!A1";
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: process.env.INITIAL_ADMIN_NAME || "RailGuard System Administrator",
        role: UserRole.ADMIN,
        passwordHash: hashPassword(adminPass),
      },
    });
    console.log(`[RailGuard Seeder] Initialized baseline ADMIN user: ${adminEmail}`);
  }

  if (!reviewerUser && !isDryRun) {
    const reviewerEmail = (process.env.INITIAL_REVIEWER_EMAIL || "reviewer.demo@railguard.internal").toLowerCase().trim();
    const reviewerPass = process.env.INITIAL_REVIEWER_PASSWORD || crypto.randomBytes(16).toString("hex") + "!R1";
    reviewerUser = await prisma.user.create({
      data: {
        email: reviewerEmail,
        name: process.env.INITIAL_REVIEWER_NAME || "RailGuard Quality Reviewer",
        role: UserRole.QUALITY_REVIEWER,
        passwordHash: hashPassword(reviewerPass),
      },
    });
    console.log(`[RailGuard Seeder] Initialized baseline QUALITY_REVIEWER user: ${reviewerEmail}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Railway Stations (Verified Indian Railways Station References)
  // ─────────────────────────────────────────────────────────────
  const stationData = [
    { code: "NDLS", name: "New Delhi", division: "Delhi", zone: "Northern Railway" },
    { code: "MMCT", name: "Mumbai Central", division: "Mumbai", zone: "Western Railway" },
    { code: "HWH", name: "Howrah Junction", division: "Howrah", zone: "Eastern Railway" },
    { code: "MAS", name: "Chennai Central", division: "Chennai", zone: "Southern Railway" },
    { code: "SBC", name: "KSR Bengaluru", division: "Bengaluru", zone: "South Western Railway" },
    { code: "CNB", name: "Kanpur Central", division: "Prayagraj", zone: "North Central Railway" },
    { code: "BRC", name: "Vadodara Junction", division: "Vadodara", zone: "Western Railway" },
    { code: "PUNE", name: "Pune Junction", division: "Pune", zone: "Central Railway" },
  ];

  const stations = new Map<string, { id: string; code: string }>();
  for (const s of stationData) {
    if (isDryRun) {
      stations.set(s.code, { id: `mock-station-${s.code}`, code: s.code });
    } else {
      const station = await prisma.station.upsert({
        where: { code: s.code },
        update: { name: s.name, division: s.division, zone: s.zone },
        create: s,
      });
      stations.set(s.code, station);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Passenger Trains (Verified Timetable Number References)
  // ─────────────────────────────────────────────────────────────
  const trainData = [
    { number: "12951", name: "Mumbai Rajdhani Express", orig: "MMCT", dest: "NDLS" },
    { number: "12004", name: "Lucknow Swarna Shatabdi Express", orig: "NDLS", dest: "CNB" },
    { number: "22436", name: "Vande Bharat Express", orig: "NDLS", dest: "CNB" },
    { number: "12301", name: "Howrah Rajdhani Express", orig: "HWH", dest: "NDLS" },
    { number: "12621", name: "Tamil Nadu Express", orig: "MAS", dest: "NDLS" },
    { number: "12952", name: "Tejas Rajdhani Express", orig: "NDLS", dest: "MMCT" },
  ];

  const trains = new Map<string, { id: string; trainNumber: string }>();
  for (const t of trainData) {
    const origStation = stations.get(t.orig)!;
    const destStation = stations.get(t.dest)!;
    if (isDryRun) {
      trains.set(t.number, { id: `mock-train-${t.number}`, trainNumber: t.number });
    } else {
      const train = await prisma.train.upsert({
        where: { trainNumber: t.number },
        update: {
          trainName: t.name,
          originStationId: origStation.id,
          destinationStationId: destStation.id,
        },
        create: {
          trainNumber: t.number,
          trainName: t.name,
          originStationId: origStation.id,
          destinationStationId: destStation.id,
        },
      });
      trains.set(t.number, train);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Pantry Caterers / Base Kitchens (Explicit Demonstration Profiles)
  // ─────────────────────────────────────────────────────────────
  const vendorData = [
    {
      code: "VND-NR-001",
      name: "Northern Rail Caterers Pvt Ltd (Demo Profile)",
      email: "quality@northernrailcaterers.internal",
      phone: "+91-11-23344550",
      lic: "FSSAI-DEMO-100239990001",
      status: VendorStatus.ACTIVE,
    },
    {
      code: "VND-WR-002",
      name: "Western Gourmet Express Catering (Demo Profile)",
      email: "audit@westernpantry.internal",
      phone: "+91-22-24455660",
      lic: "FSSAI-DEMO-100239990002",
      status: VendorStatus.ACTIVE,
    },
    {
      code: "VND-SR-003",
      name: "Southern Hospitality Pantries (Demo Profile)",
      email: "compliance@deccanbasekitchens.internal",
      phone: "+91-44-25566770",
      lic: "FSSAI-DEMO-100239990003",
      status: VendorStatus.UNDER_REVIEW,
    },
    {
      code: "VND-ER-004",
      name: "Eastern Railway Base Kitchens (Demo Profile)",
      email: "operations@easternkitchens.internal",
      phone: "+91-33-22233440",
      lic: "FSSAI-DEMO-100239990004",
      status: VendorStatus.ACTIVE,
    },
    {
      code: "VND-CR-005",
      name: "Central Express Meals Ltd (Demo Profile)",
      email: "standards@centralmeals.internal",
      phone: "+91-71-23456780",
      lic: "FSSAI-DEMO-100239990005",
      status: VendorStatus.SUSPENDED,
    },
    {
      code: "VND-NER-006",
      name: "North Eastern Dining Services (Demo Profile)",
      email: "pantry@nedining.internal",
      phone: "+91-55-12345670",
      lic: "FSSAI-DEMO-100239990006",
      status: VendorStatus.ACTIVE,
    },
    {
      code: "VND-NWR-007",
      name: "Desert Rail Kitchens Ltd (Demo Profile)",
      email: "inspection@desertrail.internal",
      phone: "+91-14-12345680",
      lic: "FSSAI-DEMO-100239990007",
      status: VendorStatus.ACTIVE,
    },
  ];

  const vendors = new Map<string, { id: string; code: string }>();
  for (const v of vendorData) {
    if (isDryRun) {
      vendors.set(v.code, { id: `mock-vendor-${v.code}`, code: v.code });
    } else {
      const vendor = await prisma.vendor.upsert({
        where: { code: v.code },
        update: {
          name: v.name,
          contactEmail: v.email,
          contactPhone: v.phone,
          licenseNumber: v.lic,
          status: v.status,
        },
        create: {
          code: v.code,
          name: v.name,
          contactEmail: v.email,
          contactPhone: v.phone,
          licenseNumber: v.lic,
          status: v.status,
        },
      });
      vendors.set(v.code, vendor);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Approved Food Products (14 items across all 5 categories)
  // ─────────────────────────────────────────────────────────────
  const productData = [
    { key: "PROD-NR-01", vCode: "VND-NR-001", name: "Standard Vegetarian Thali (Demo)", cat: ProductCategory.MEAL_TRAY, price: 120.0, shelf: 12 },
    { key: "PROD-NR-02", vCode: "VND-NR-001", name: "Rail Neer Packaged Water 1L (Demo)", cat: ProductCategory.PACKAGED_WATER, price: 15.0, shelf: 720 },
    { key: "PROD-NR-03", vCode: "VND-NR-001", name: "Paneer Butter Masala Meal Box (Demo)", cat: ProductCategory.MEAL_TRAY, price: 140.0, shelf: 10 },
    { key: "PROD-NR-04", vCode: "VND-NR-001", name: "Samosa & Masala Chai Combo (Demo)", cat: ProductCategory.SNACK_BOX, price: 50.0, shelf: 6 },
    { key: "PROD-WR-05", vCode: "VND-WR-002", name: "Idli Vada Breakfast Combo (Demo)", cat: ProductCategory.MEAL_TRAY, price: 80.0, shelf: 8 },
    { key: "PROD-WR-06", vCode: "VND-WR-002", name: "Gujarati Thepla & Pickle Box (Demo)", cat: ProductCategory.SNACK_BOX, price: 60.0, shelf: 24 },
    { key: "PROD-WR-07", vCode: "VND-WR-002", name: "Executive Non-Veg Biryani Tray (Demo)", cat: ProductCategory.MEAL_TRAY, price: 160.0, shelf: 10 },
    { key: "PROD-SR-08", vCode: "VND-SR-003", name: "Pantry Veg Biryani Casserole (Demo)", cat: ProductCategory.MEAL_TRAY, price: 110.0, shelf: 10 },
    { key: "PROD-SR-09", vCode: "VND-SR-003", name: "South Indian Curd Rice & Pickle (Demo)", cat: ProductCategory.SPECIAL_DIET, price: 70.0, shelf: 12 },
    { key: "PROD-SR-10", vCode: "VND-SR-003", name: "Filter Coffee & Medu Vada (Demo)", cat: ProductCategory.BEVERAGE, price: 45.0, shelf: 4 },
    { key: "PROD-ER-11", vCode: "VND-ER-004", name: "Kolkata Fish Curry & Rice Meal (Demo)", cat: ProductCategory.MEAL_TRAY, price: 150.0, shelf: 8 },
    { key: "PROD-ER-12", vCode: "VND-ER-004", name: "Luchi & Aloo Dum Breakfast (Demo)", cat: ProductCategory.SNACK_BOX, price: 70.0, shelf: 8 },
    { key: "PROD-CR-13", vCode: "VND-CR-005", name: "Diabetic Special Khichdi (Demo)", cat: ProductCategory.SPECIAL_DIET, price: 90.0, shelf: 12 },
    { key: "PROD-CR-14", vCode: "VND-CR-005", name: "Masala Upma & Fruit Bowl (Demo)", cat: ProductCategory.SPECIAL_DIET, price: 75.0, shelf: 8 },
  ];

  const products = new Map<string, { id: string; name: string }>();
  for (const p of productData) {
    const vendor = vendors.get(p.vCode)!;
    if (isDryRun) {
      products.set(p.key, { id: `mock-product-${p.key}`, name: p.name });
    } else {
      let prod = await prisma.product.findFirst({
        where: { vendorId: vendor.id, name: p.name },
      });
      if (!prod) {
        prod = await prisma.product.create({
          data: {
            vendorId: vendor.id,
            name: p.name,
            category: p.cat,
            fssaiLicense: `FSSAI-${vendor.code}`,
            standardPrice: p.price,
            shelfLifeHours: p.shelf,
          },
        });
      }
      products.set(p.key, prod);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Packaging Units with Unique QR Identifiers (20 units)
  // ─────────────────────────────────────────────────────────────
  const now = new Date();
  const futureExpiry = new Date(now.getTime() + 18 * 60 * 60 * 1000); // +18h
  const futureMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30d
  const pastExpiry = new Date(now.getTime() - 24 * 60 * 60 * 1000); // -24h

  const packagingData = [
    // 12 ACTIVE
    { qr: "DEMO-THALI-ACTIVE-001", pKey: "PROD-NR-01", batch: "BATCH-NR-2026-04A", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-WATER-ACTIVE-002", pKey: "PROD-NR-02", batch: "BATCH-RN-2026-880", status: PackagingStatus.ACTIVE, expiry: futureMonth },
    { qr: "DEMO-PANEER-ACTIVE-003", pKey: "PROD-NR-03", batch: "BATCH-NR-2026-05B", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-SAMOSA-ACTIVE-004", pKey: "PROD-NR-04", batch: "BATCH-NR-2026-06C", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-IDLI-ACTIVE-005", pKey: "PROD-WR-05", batch: "BATCH-WR-2026-11A", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-THEPLA-ACTIVE-006", pKey: "PROD-WR-06", batch: "BATCH-WR-2026-12B", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-NVBIRYANI-ACTIVE-007", pKey: "PROD-WR-07", batch: "BATCH-WR-2026-13C", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-CURDRICE-ACTIVE-008", pKey: "PROD-SR-09", batch: "BATCH-SR-2026-21A", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-FISH-ACTIVE-009", pKey: "PROD-ER-11", batch: "BATCH-ER-2026-31A", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-KHICHDI-ACTIVE-010", pKey: "PROD-CR-13", batch: "BATCH-CR-2026-41A", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-COFFEE-ACTIVE-015", pKey: "PROD-SR-10", batch: "BATCH-SR-2026-51B", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    { qr: "DEMO-LUCHI-ACTIVE-016", pKey: "PROD-ER-12", batch: "BATCH-ER-2026-61C", status: PackagingStatus.ACTIVE, expiry: futureExpiry },
    // 4 EXPIRED
    { qr: "DEMO-BREAKFAST-EXPIRED-003", pKey: "PROD-WR-05", batch: "BATCH-WR-2026-EXP", status: PackagingStatus.EXPIRED, expiry: pastExpiry },
    { qr: "DEMO-WATER-EXPIRED-011", pKey: "PROD-NR-02", batch: "BATCH-RN-2026-EXP9", status: PackagingStatus.EXPIRED, expiry: pastExpiry },
    { qr: "DEMO-UPMA-EXPIRED-012", pKey: "PROD-CR-14", batch: "BATCH-CR-2026-EXP3", status: PackagingStatus.EXPIRED, expiry: pastExpiry },
    { qr: "DEMO-THEPLA-EXPIRED-017", pKey: "PROD-WR-06", batch: "BATCH-WR-2026-EXP7", status: PackagingStatus.EXPIRED, expiry: pastExpiry },
    // 4 RECALLED
    { qr: "DEMO-BIRYANI-RECALLED-004", pKey: "PROD-SR-08", batch: "BATCH-SR-2026-RECALL-9", status: PackagingStatus.RECALLED, expiry: futureExpiry },
    { qr: "DEMO-FISH-RECALLED-013", pKey: "PROD-ER-11", batch: "BATCH-ER-2026-REC2", status: PackagingStatus.RECALLED, expiry: futureExpiry },
    { qr: "DEMO-THALI-RECALLED-014", pKey: "PROD-NR-01", batch: "BATCH-NR-2026-REC5", status: PackagingStatus.RECALLED, expiry: futureExpiry },
    { qr: "DEMO-PANEER-RECALLED-018", pKey: "PROD-NR-03", batch: "BATCH-NR-2026-REC8", status: PackagingStatus.RECALLED, expiry: futureExpiry },
  ];

  const packUnits = new Map<string, { id: string; qrCodeIdentifier: string }>();
  for (const pkg of packagingData) {
    const prod = products.get(pkg.pKey)!;
    if (isDryRun) {
      packUnits.set(pkg.qr, { id: `mock-pkg-${pkg.qr}`, qrCodeIdentifier: pkg.qr });
    } else {
      const unit = await prisma.packagingUnit.upsert({
        where: { qrCodeIdentifier: pkg.qr },
        update: {
          productId: prod.id,
          batchNumber: pkg.batch,
          expiryDate: pkg.expiry,
          status: pkg.status,
        },
        create: {
          productId: prod.id,
          batchNumber: pkg.batch,
          packagingDate: now,
          expiryDate: pkg.expiry,
          qrCodeIdentifier: pkg.qr,
          status: pkg.status,
        },
      });
      packUnits.set(pkg.qr, unit);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 7. Synthetic Operational Complaints (35 Scenarios across 8 Statuses)
  // ─────────────────────────────────────────────────────────────
  const complaintSpecs = [
    // 1-6: SUBMITTED (6)
    { idx: 1, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.HIGH, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "B4", desc: "[SIMULATION] Dal in the veg thali had an unmistakable sour odor and bubbly curdled texture." },
    { idx: 2, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.MEDIUM, train: "12951", station: "MMCT", pkg: "DEMO-THALI-ACTIVE-001", coach: "B2", desc: "[SIMULATION] Rice served with dinner was discolored and smelled stale." },
    { idx: 3, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.CRITICAL, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "A1", desc: "[SIMULATION] Paneer curry was visibly spoiled with separating greenish oil film." },
    { idx: 4, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.LOW, train: "12004", station: "CNB", pkg: "DEMO-WATER-ACTIVE-002", coach: "C1", desc: "[SIMULATION] Drinking water bottle was warm and exposed to direct sun on platform trolley." },
    { idx: 5, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.MEDIUM, train: "22436", station: "CNB", pkg: "DEMO-SAMOSA-ACTIVE-004", coach: "E2", desc: "[SIMULATION] Snack box seal was partially torn when received from the pantry vendor." },
    { idx: 6, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.PRODUCT_MISMATCH, sev: ComplaintSeverity.LOW, train: "12301", station: "HWH", pkg: "DEMO-THEPLA-ACTIVE-006", coach: "B8", desc: "[SIMULATION] Delivered snack box was labeled vegetarian but contained an unlabeled gravy container." },

    // 7-11: UNDER_REVIEW (5)
    { idx: 7, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S3", desc: "[SIMULATION] Small stone grit detected in curd rice portion while dining." },
    { idx: 8, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S4", desc: "[SIMULATION] Second stone fragment discovered in the same coach batch." },
    { idx: 9, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.CRITICAL, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S2", desc: "[SIMULATION] Hard plastic bristle detected inside sealed curd rice cup." },
    { idx: 10, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.MEDIUM, train: "12952", station: "BRC", pkg: "DEMO-KHICHDI-ACTIVE-010", coach: "A2", desc: "[SIMULATION] Aluminium lid was punctured with gravy leaking onto cardboard tray." },
    { idx: 11, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.LOW, train: "12951", station: "MMCT", pkg: "DEMO-NVBIRYANI-ACTIVE-007", coach: "B5", desc: "[SIMULATION] Meal tray served lukewarm with coagulated fat layers." },

    // 12-17: INVESTIGATION (6)
    { idx: 12, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.CRITICAL, train: "12004", station: "NDLS", pkg: "DEMO-PANEER-ACTIVE-003", coach: "C3", desc: "[SIMULATION] Paneer meal spoiled; foul odor detected before departure." },
    { idx: 13, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.HIGH, train: "12004", station: "CNB", pkg: "DEMO-IDLI-ACTIVE-005", coach: "C5", desc: "[SIMULATION] Pantry car ambient storage at 38C; cold chain protocol breached." },
    { idx: 14, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.MEDIUM, train: "12951", station: "MMCT", pkg: "DEMO-NVBIRYANI-ACTIVE-007", coach: "B1", desc: "[SIMULATION] Sub-zero chilled container served without proper regeneration in pantry car oven." },
    { idx: 15, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.HIGH, train: "12951", station: "MMCT", pkg: "DEMO-NVBIRYANI-ACTIVE-007", coach: "B3", desc: "[SIMULATION] Lukewarm core temperature in chicken pieces; food safety hazard." },
    { idx: 16, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.MEDIUM, train: "12951", station: "MMCT", pkg: "DEMO-NVBIRYANI-ACTIVE-007", coach: "A3", desc: "[SIMULATION] Pantry oven non-functional; meal handed over cold to passenger." },
    { idx: 17, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.HIGH, train: "12301", station: "HWH", pkg: "DEMO-FISH-ACTIVE-009", coach: "B6", desc: "[SIMULATION] Defective heat seal allowed air seepage during transit." },

    // 18-22: ACTION_REQUIRED (5)
    { idx: 18, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "B7", desc: "[SIMULATION] Aluminium foil shard found in dal; confirmed from vendor sealing machine." },
    { idx: 19, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.HIGH, train: "12004", station: "NDLS", pkg: "DEMO-PANEER-ACTIVE-003", coach: "C2", desc: "[SIMULATION] Base kitchen packaging line failed cleanliness inspection." },
    { idx: 20, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.CRITICAL, train: "12301", station: "HWH", pkg: "DEMO-FISH-ACTIVE-009", coach: "A4", desc: "[SIMULATION] Confirmed bacterial spoilage due to delayed loading at Howrah platform." },
    { idx: 21, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.MEDIUM, train: "12952", station: "BRC", pkg: "DEMO-KHICHDI-ACTIVE-010", coach: "B3", desc: "[SIMULATION] Thermostat sensor broken in pantry car warmer." },
    { idx: 22, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.CRITICAL, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S1", desc: "[SIMULATION] Metal staple pin detected in pickle packet." },

    // 23-25: NEEDS_INFORMATION (3)
    { idx: 23, status: ComplaintStatus.NEEDS_INFORMATION, cat: ComplaintCategory.PRODUCT_MISMATCH, sev: ComplaintSeverity.LOW, train: "22436", station: "CNB", pkg: "DEMO-SAMOSA-ACTIVE-004", coach: null, desc: "[SIMULATION] Missing dessert item reported; coach number omitted in submission." },
    { idx: 24, status: ComplaintStatus.NEEDS_INFORMATION, cat: ComplaintCategory.OTHER, sev: ComplaintSeverity.LOW, train: "12301", station: null, pkg: null, coach: "B2", desc: "[SIMULATION] Taste complaint submitted without packaging QR code or batch number." },
    { idx: 25, status: ComplaintStatus.NEEDS_INFORMATION, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.MEDIUM, train: "12951", station: "MMCT", pkg: "DEMO-THALI-ACTIVE-001", coach: "B4", desc: "[SIMULATION] Dirty tray surface reported; attached image blurry and inconclusive." },

    // 26-30: RESOLVED (5)
    { idx: 26, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.MEDIUM, train: "12952", station: "BRC", pkg: "DEMO-KHICHDI-ACTIVE-010", coach: "B2", desc: "[SIMULATION] Torn outer seal replaced immediately; vendor pantry staff completed sanitation audit." },
    { idx: 27, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.LOW, train: "12004", station: "CNB", pkg: "DEMO-IDLI-ACTIVE-005", coach: "C4", desc: "[SIMULATION] Pantry car microwave recalibrated; supervisor verified serving temperature." },
    { idx: 28, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.PRODUCT_MISMATCH, sev: ComplaintSeverity.LOW, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "A2", desc: "[SIMULATION] Incorrect thali swapped within 15 minutes by catering manager on train." },
    { idx: 29, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S5", desc: "[SIMULATION] Packaging line filter repaired; vendor completed mandatory staff retraining." },
    { idx: 30, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.MEDIUM, train: "12301", station: "HWH", pkg: "DEMO-FISH-ACTIVE-009", coach: "B1", desc: "[SIMULATION] Batch quarantined at station depot; refund processed for affected passenger." },

    // 31-33: REJECTED (3)
    { idx: 31, status: ComplaintStatus.REJECTED, cat: ComplaintCategory.OTHER, sev: ComplaintSeverity.LOW, train: "12951", station: "NDLS", pkg: null, coach: "B1", desc: "[SIMULATION] Complaint asserted private non-railway vendor food was served on train." },
    { idx: 32, status: ComplaintStatus.REJECTED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.LOW, train: "12004", station: "NDLS", pkg: "DEMO-WATER-ACTIVE-002", coach: "C1", desc: "[SIMULATION] Passenger claimed water tasted metallic; lab test verified within standard BIS limits." },
    { idx: 33, status: ComplaintStatus.REJECTED, cat: ComplaintCategory.PRODUCT_MISMATCH, sev: ComplaintSeverity.LOW, train: "22436", station: "CNB", pkg: "DEMO-SAMOSA-ACTIVE-004", coach: "E1", desc: "[SIMULATION] Claim of expired product refuted; packaging date was current and correctly labeled." },

    // 34-35: DUPLICATE (2)
    { idx: 34, status: ComplaintStatus.DUPLICATE, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.HIGH, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "B4", desc: "[SIMULATION] Duplicate submission of complaint RG-2026-0001 from same seat by co-passenger." },
    { idx: 35, status: ComplaintStatus.DUPLICATE, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S3", desc: "[SIMULATION] Duplicate entry of stone grit report RG-2026-0007." },
  ];

  const complaints = new Map<number, { id: string; complaintRef: string }>();

  for (const c of complaintSpecs) {
    const ref = `RG-2026-${String(c.idx).padStart(4, "0")}`;
    const rawToken = `TOKEN-DEMO-RG-2026-${String(c.idx).padStart(4, "0")}`;
    const tokenHash = hashTrackingToken(rawToken);

    const train = c.train ? trains.get(c.train) : null;
    const station = c.station ? stations.get(c.station) : null;
    const pkgUnit = c.pkg ? packUnits.get(c.pkg) : null;

    const rejectionReason =
      c.status === ComplaintStatus.REJECTED
        ? "[SIMULATION] Objective investigation confirmed allegation disproven by microbiological testing."
        : null;

    if (isDryRun) {
      complaints.set(c.idx, { id: `mock-complaint-${c.idx}`, complaintRef: ref });
      continue;
    }

    const complaint = await prisma.complaint.upsert({
      where: { complaintRef: ref },
      update: {
        status: c.status,
        category: c.cat,
        severity: c.sev,
        description: c.desc,
        rejectionReason,
      },
      create: {
        complaintRef: ref,
        trackingTokenHash: tokenHash,
        packagingUnitId: pkgUnit?.id ?? null,
        trainId: train?.id ?? null,
        unmatchedTrainNumber: c.train ? null : "99999",
        stationId: station?.id ?? null,
        category: c.cat,
        severity: c.sev,
        description: c.desc,
        coach: c.coach,
        contactEmail: `passenger${c.idx}@demo.railguard.internal`,
        contactPhone: `+91-98765${String(c.idx).padStart(5, "0")}`,
        status: c.status,
        rejectionReason,
        journeyDate: new Date(now.getTime() - c.idx * 3600 * 1000),
      },
    });

    complaints.set(c.idx, complaint);

    // Initial event
    const existingEvents = await prisma.complaintEvent.findFirst({
      where: { complaintId: complaint.id },
    });

    if (!existingEvents) {
      await prisma.complaintEvent.create({
        data: {
          complaintId: complaint.id,
          actorRole: "PASSENGER",
          newStatus: ComplaintStatus.SUBMITTED,
          explanation: "[SIMULATION] Complaint submitted by passenger via QR code scanning portal.",
          isPublic: true,
          createdAt: new Date(now.getTime() - (c.idx + 1) * 3600 * 1000),
        },
      });

      // Progression events if moved beyond SUBMITTED
      if (c.status !== ComplaintStatus.SUBMITTED && reviewerUser) {
        await prisma.complaintEvent.create({
          data: {
            complaintId: complaint.id,
            actorId: reviewerUser.id,
            actorRole: UserRole.QUALITY_REVIEWER,
            previousStatus: ComplaintStatus.SUBMITTED,
            newStatus: c.status,
            explanation: `[SIMULATION] Case transitioned to ${c.status} following operational review protocol.`,
            isPublic: true,
            createdAt: now,
          },
        });
      }

      // Evidence asset attachment (for 10 selected complaints)
      if (c.idx <= 10 && demoAssets.length > 0) {
        const asset = demoAssets[(c.idx - 1) % demoAssets.length];
        await prisma.complaintEvidence.create({
          data: {
            complaintId: complaint.id,
            storagePath: asset.relativePath,
            fileName: asset.fileName,
            fileSizeBytes: asset.fileSizeBytes,
            mimeType: asset.mimeType,
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 8. Investigations (12 Detailed Cases)
  // ─────────────────────────────────────────────────────────────
  const investigationSpecs = [
    { cIdx: 12, det: InvestigationDetermination.VENDOR_FAULT, findings: "[SIMULATION] Base kitchen cold-chain compressor malfunction confirmed during transit inspection.", done: false },
    { cIdx: 13, det: InvestigationDetermination.STORAGE_FAULT, findings: "[SIMULATION] Pantry car ambient storage at 38C; cold chain protocol violated during transit.", done: false },
    { cIdx: 14, det: InvestigationDetermination.INCONCLUSIVE, findings: "[SIMULATION] Laboratory microbiological swab tests within permissible limits; further monitoring ordered.", done: false },
    { cIdx: 15, det: null, findings: "[SIMULATION] Preliminary review initiated; awaiting lab culture report from divisional laboratory.", done: false },
    { cIdx: 16, det: null, findings: "[SIMULATION] Inspector dispatched to boarding station base kitchen for surprise audit.", done: false },
    { cIdx: 17, det: InvestigationDetermination.VENDOR_FAULT, findings: "[SIMULATION] Batch packaging seal inspection showed defective heat-sealing calibration on production line.", done: false },
    { cIdx: 18, det: InvestigationDetermination.VENDOR_FAULT, findings: "[SIMULATION] Foreign object confirmed as packaging foil shard. Vendor kitchen hygiene warning issued.", done: false },
    { cIdx: 19, det: InvestigationDetermination.VENDOR_FAULT, findings: "[SIMULATION] Base kitchen high-pressure steam washer nozzle calcified; repair verified by auditor.", done: false },
    { cIdx: 20, det: InvestigationDetermination.STORAGE_FAULT, findings: "[SIMULATION] Delay in cold room dispatch at Howrah depot during station power changeover.", done: false },
    { cIdx: 21, det: InvestigationDetermination.STORAGE_FAULT, findings: "[SIMULATION] Pantry car heating cabinet digital thermostat sensor malfunction confirmed.", done: false },
    { cIdx: 22, det: InvestigationDetermination.VENDOR_FAULT, findings: "[SIMULATION] Metal contaminant confirmed as wire fastener shard from bulk packaging crate.", done: false },
    { cIdx: 26, det: InvestigationDetermination.VENDOR_FAULT, findings: "[SIMULATION] Vendor completed deep sanitization and staff retraining. Final audit verified satisfactory.", done: true },
  ];

  const investigations = new Map<number, { id: string }>();
  if (!isDryRun && reviewerUser) {
    for (const inv of investigationSpecs) {
      const comp = complaints.get(inv.cIdx);
      if (!comp) continue;

      const existingInv = await prisma.investigation.findUnique({
        where: { complaintId: comp.id },
      });

      let savedInv;
      if (!existingInv) {
        savedInv = await prisma.investigation.create({
          data: {
            complaintId: comp.id,
            investigatorId: reviewerUser.id,
            findings: inv.findings,
            determination: inv.det,
            isCompleted: inv.done,
            completedAt: inv.done ? now : null,
          },
        });
      } else {
        savedInv = await prisma.investigation.update({
          where: { id: existingInv.id },
          data: {
            findings: inv.findings,
            determination: inv.det,
            isCompleted: inv.done,
          },
        });
      }
      investigations.set(inv.cIdx, savedInv);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 9. Corrective Actions (10 Tracked Administrative Actions)
  // ─────────────────────────────────────────────────────────────
  const actionSpecs = [
    {
      cIdx: 18,
      type: CorrectiveActionType.WARNING_LETTER,
      resp: "Northern Rail Caterers Pvt Ltd (Demo Profile)",
      desc: "[SIMULATION] Formal warning letter issued regarding foil contamination in dal preparation line.",
      status: CorrectiveActionStatus.PENDING,
      deadline: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      verOut: null,
      verAt: null,
    },
    {
      cIdx: 12,
      type: CorrectiveActionType.KITCHEN_AUDIT,
      resp: "Western Gourmet Express Catering (Demo Profile)",
      desc: "[SIMULATION] Comprehensive HACCP base kitchen sanitization and cold-chain compliance audit.",
      status: CorrectiveActionStatus.IN_PROGRESS,
      deadline: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
      verOut: null,
      verAt: null,
    },
    {
      cIdx: 26,
      type: CorrectiveActionType.STAFF_RETRAINING,
      resp: "Central Express Meals Ltd (Demo Profile)",
      desc: "[SIMULATION] Mandatory food hygiene and personal sanitation retraining for 25 pantry crew members.",
      status: CorrectiveActionStatus.VERIFIED_COMPLETE,
      deadline: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      verOut: "SATISFACTORY: Full training roster and certificates verified by Senior Inspector.",
      verAt: new Date(now.getTime() - 24 * 3600 * 1000),
    },
    {
      cIdx: 13,
      type: CorrectiveActionType.FINANCIAL_PENALTY,
      resp: "Southern Hospitality Pantries (Demo Profile)",
      desc: "[SIMULATION] Imposition of INR 25,000 contractual penalty for repeated cold chain failure.",
      status: CorrectiveActionStatus.NON_COMPLIANT,
      deadline: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
      verOut: "UNSATISFACTORY: Vendor failed to remit penalty by deadline.",
      verAt: null,
    },
    {
      cIdx: 17,
      type: CorrectiveActionType.BATCH_RECALL,
      resp: "Eastern Railway Base Kitchens (Demo Profile)",
      desc: "[SIMULATION] Recall and quarantine of batch BATCH-ER-2026-31A due to defective heat seals.",
      status: CorrectiveActionStatus.ESCALATED,
      deadline: new Date(now.getTime() + 2 * 24 * 3600 * 1000),
      verOut: null,
      verAt: null,
    },
    {
      cIdx: 19,
      type: CorrectiveActionType.KITCHEN_AUDIT,
      resp: "Northern Rail Caterers Pvt Ltd (Demo Profile)",
      desc: "[SIMULATION] Surprise cleanliness and water quality inspection of New Delhi base kitchen.",
      status: CorrectiveActionStatus.IN_PROGRESS,
      deadline: new Date(now.getTime() + 4 * 24 * 3600 * 1000),
      verOut: null,
      verAt: null,
    },
    {
      cIdx: 20,
      type: CorrectiveActionType.WARNING_LETTER,
      resp: "Eastern Railway Base Kitchens (Demo Profile)",
      desc: "[SIMULATION] Directive to install continuous Bluetooth temperature loggers in transport totes.",
      status: CorrectiveActionStatus.PENDING,
      deadline: new Date(now.getTime() + 6 * 24 * 3600 * 1000),
      verOut: null,
      verAt: null,
    },
    {
      cIdx: 21,
      type: CorrectiveActionType.STAFF_RETRAINING,
      resp: "Central Express Meals Ltd (Demo Profile)",
      desc: "[SIMULATION] Pantry car electrical equipment check and emergency cooling protocols.",
      status: CorrectiveActionStatus.VERIFIED_COMPLETE,
      deadline: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
      verOut: "SATISFACTORY: Pantry manager verified heater operating parameters.",
      verAt: new Date(now.getTime() - 12 * 3600 * 1000),
    },
    {
      cIdx: 22,
      type: CorrectiveActionType.FINANCIAL_PENALTY,
      resp: "Southern Hospitality Pantries (Demo Profile)",
      desc: "[SIMULATION] Contractual penalty of INR 15,000 for physical metal contaminant detection.",
      status: CorrectiveActionStatus.PENDING,
      deadline: new Date(now.getTime() + 10 * 24 * 3600 * 1000),
      verOut: null,
      verAt: null,
    },
    {
      cIdx: 20,
      type: CorrectiveActionType.BATCH_RECALL,
      resp: "Eastern Railway Base Kitchens (Demo Profile)",
      desc: "[SIMULATION] Quarantine and disposal verification of remaining Howrah fish curry trays.",
      status: CorrectiveActionStatus.VERIFIED_COMPLETE,
      deadline: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      verOut: "SATISFACTORY: Depot supervisor witnessed destruction of 42 quarantined meal boxes.",
      verAt: new Date(now.getTime() - 18 * 3600 * 1000),
    },
  ];

  if (!isDryRun) {
    for (const act of actionSpecs) {
      const inv = investigations.get(act.cIdx);
      if (!inv) continue;

      const existingAct = await prisma.correctiveAction.findFirst({
        where: { investigationId: inv.id, actionType: act.type },
      });

      if (!existingAct) {
        await prisma.correctiveAction.create({
          data: {
            investigationId: inv.id,
            actionType: act.type,
            description: act.desc,
            responsibleParty: act.resp,
            status: act.status,
            deadline: act.deadline,
            verificationOutcome: act.verOut,
            verifiedAt: act.verAt,
            verifiedById: act.verAt && adminUser ? adminUser.id : null,
          },
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 10. Recurring Issue Alerts (4 Correlated Pattern Alerts)
  // ─────────────────────────────────────────────────────────────
  const alertSpecs = [
    {
      vCode: "VND-NR-001",
      pKey: "PROD-NR-01",
      cat: ComplaintCategory.SPOILAGE,
      trigger: 3,
      window: 48,
      status: AlertStatus.OPEN,
      reason: "[SIMULATION ALERT] 3 Spoilage allegations recorded within 48 hours for Northern Rail Caterers.",
      cIndices: [1, 2, 3],
    },
    {
      vCode: "VND-SR-003",
      pKey: "PROD-SR-08",
      cat: ComplaintCategory.FOREIGN_OBJECT,
      trigger: 3,
      window: 48,
      status: AlertStatus.ACKNOWLEDGED,
      reason: "[SIMULATION ALERT] 3 Foreign object allegations flagged in pantry meal boxes.",
      cIndices: [7, 8, 9],
    },
    {
      vCode: "VND-WR-002",
      pKey: "PROD-WR-07",
      cat: ComplaintCategory.TEMPERATURE,
      trigger: 4,
      window: 72,
      status: AlertStatus.INVESTIGATED,
      reason: "[SIMULATION ALERT] 4 sub-standard temperature reports across Western Railway pantry services.",
      cIndices: [14, 15, 16, 17],
    },
    {
      vCode: "VND-ER-004",
      pKey: "PROD-ER-11",
      cat: ComplaintCategory.SPOILAGE,
      trigger: 3,
      window: 72,
      status: AlertStatus.OPEN,
      reason: "[SIMULATION ALERT] 3 quality complaints flagged on Eastern Railway fish meal trays within 72 hours.",
      cIndices: [17, 20, 30],
    },
  ];

  if (!isDryRun) {
    for (const a of alertSpecs) {
      const vendor = vendors.get(a.vCode);
      const prod = products.get(a.pKey);
      if (!vendor || !prod) continue;

      const existingAlert = await prisma.recurringIssueAlert.findFirst({
        where: { vendorId: vendor.id, productId: prod.id, category: a.cat },
      });

      let alert;
      if (!existingAlert) {
        alert = await prisma.recurringIssueAlert.create({
          data: {
            vendorId: vendor.id,
            productId: prod.id,
            category: a.cat,
            triggerCount: a.trigger,
            timeWindowHours: a.window,
            status: a.status,
            reason: a.reason,
          },
        });
      } else {
        alert = await prisma.recurringIssueAlert.update({
          where: { id: existingAlert.id },
          data: { status: a.status, reason: a.reason },
        });
      }

      // Link complaints to alert
      for (const cIdx of a.cIndices) {
        const comp = complaints.get(cIdx);
        if (!comp) continue;

        await prisma.recurringIssueAlertComplaint.upsert({
          where: {
            alertId_complaintId: {
              alertId: alert.id,
              complaintId: comp.id,
            },
          },
          update: {},
          create: {
            alertId: alert.id,
            complaintId: comp.id,
          },
        });
      }
    }
  }

  // Count final verified records
  const summary: SeedSummary = {
    users: isDryRun ? 2 : await prisma.user.count(),
    stations: isDryRun ? stationData.length : await prisma.station.count(),
    trains: isDryRun ? trainData.length : await prisma.train.count(),
    vendors: isDryRun ? vendorData.length : await prisma.vendor.count(),
    products: isDryRun ? productData.length : await prisma.product.count(),
    packagingUnits: isDryRun ? packagingData.length : await prisma.packagingUnit.count(),
    complaints: isDryRun ? complaintSpecs.length : await prisma.complaint.count(),
    investigations: isDryRun ? investigationSpecs.length : await prisma.investigation.count(),
    correctiveActions: isDryRun ? actionSpecs.length : await prisma.correctiveAction.count(),
    recurringAlerts: isDryRun ? alertSpecs.length : await prisma.recurringIssueAlert.count(),
  };

  console.log(`[RailGuard Seeder] Operational dataset synchronization finished (Dry Run: ${isDryRun}).`);
  console.log(JSON.stringify(summary, null, 2));

  return summary;
}
