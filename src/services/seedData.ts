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

/**
 * Executes a deterministic, idempotent seed of all RailGuard demonstration fixtures.
 * Uses upserts and deterministic identifiers so running multiple times produces
 * the exact expected record counts without duplication.
 */
export async function seedRailGuardData(prisma: PrismaClient): Promise<SeedSummary> {
  console.log("[RailGuard Seeder] Initializing demonstration fixtures...");

  // Ensure synthetic placeholder SVG assets exist on disk
  const demoAssets = ensureDemoEvidenceAssets();

  // 1. Seed Authorized Users (2)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@railguard.test" },
    update: {
      name: "Rajesh Kumar (Director, Quality Oversight)",
      role: UserRole.ADMIN,
    },
    create: {
      email: "admin@railguard.test",
      name: "Rajesh Kumar (Director, Quality Oversight)",
      passwordHash: "$2a$12$demoAdminHashPlaceholderForDevelopment1234567890",
      role: UserRole.ADMIN,
    },
  });

  const reviewerUser = await prisma.user.upsert({
    where: { email: "reviewer@railguard.test" },
    update: {
      name: "Priya Sharma (Sr. Catering Inspector)",
      role: UserRole.QUALITY_REVIEWER,
    },
    create: {
      email: "reviewer@railguard.test",
      name: "Priya Sharma (Sr. Catering Inspector)",
      passwordHash: "$2a$12$demoReviewerHashPlaceholderForDevelopment1234567890",
      role: UserRole.QUALITY_REVIEWER,
    },
  });

  // 2. Seed Stations (8)
  const stationData = [
    { code: "NDLS", name: "New Delhi", division: "Delhi", zone: "Northern Railway" },
    { code: "MMCT", name: "Mumbai Central", division: "Mumbai", zone: "Western Railway" },
    { code: "HWH", name: "Howrah Junction", division: "Howrah", zone: "Eastern Railway" },
    { code: "MAS", name: "Chennai Central", division: "Chennai", zone: "Southern Railway" },
    { code: "SBC", name: "KSR Bengaluru", division: "Bengaluru", zone: "South Western Railway" },
    { code: "CNB", name: "Kanpur Central", division: "Prayagraj", zone: "North Central Railway" },
    { code: "BSL", name: "Bhusawal Junction", division: "Bhusawal", zone: "Central Railway" },
    { code: "PUNE", name: "Pune Junction", division: "Pune", zone: "Central Railway" },
  ];

  const stations = new Map<string, { id: string; code: string }>();
  for (const s of stationData) {
    const station = await prisma.station.upsert({
      where: { code: s.code },
      update: { name: s.name, division: s.division, zone: s.zone },
      create: s,
    });
    stations.set(s.code, station);
  }

  // 3. Seed Trains (6)
  const trainData = [
    { number: "12951", name: "Mumbai Rajdhani Express", orig: "MMCT", dest: "NDLS" },
    { number: "12004", name: "Lucknow Swarna Shatabdi Express", orig: "NDLS", dest: "CNB" },
    { number: "22436", name: "Vande Bharat Express", orig: "NDLS", dest: "CNB" },
    { number: "12301", name: "Howrah Rajdhani Express", orig: "HWH", dest: "NDLS" },
    { number: "12621", name: "Tamil Nadu Express", orig: "MAS", dest: "NDLS" },
    { number: "12137", name: "Punjab Mail", orig: "MMCT", dest: "NDLS" },
  ];

  const trains = new Map<string, { id: string; trainNumber: string }>();
  for (const t of trainData) {
    const origStation = stations.get(t.orig)!;
    const destStation = stations.get(t.dest)!;
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

  // 4. Seed Caterers / Vendors (5)
  const vendorData = [
    {
      code: "VND-NR-001",
      name: "Northern Rail Caterers Pvt Ltd (Demo)",
      email: "quality@northernrailcaterers.test",
      phone: "+91-11-23344550",
      lic: "FSSAI-100239990001",
      status: VendorStatus.ACTIVE,
    },
    {
      code: "VND-WR-002",
      name: "Western Gourmet Express Catering (Demo)",
      email: "audit@westernpantry.test",
      phone: "+91-22-24455660",
      lic: "FSSAI-100239990002",
      status: VendorStatus.ACTIVE,
    },
    {
      code: "VND-SR-003",
      name: "Southern Hospitality Pantries (Demo)",
      email: "compliance@deccanbasekitchens.test",
      phone: "+91-44-25566770",
      lic: "FSSAI-100239990003",
      status: VendorStatus.UNDER_REVIEW,
    },
    {
      code: "VND-ER-004",
      name: "Eastern Railway Base Kitchens (Demo)",
      email: "operations@easternkitchens.test",
      phone: "+91-33-22233440",
      lic: "FSSAI-100239990004",
      status: VendorStatus.ACTIVE,
    },
    {
      code: "VND-CR-005",
      name: "Central Express Meals Ltd (Demo)",
      email: "standards@centralmeals.test",
      phone: "+91-71-23456780",
      lic: "FSSAI-100239990005",
      status: VendorStatus.SUSPENDED,
    },
  ];

  const vendors = new Map<string, { id: string; code: string }>();
  for (const v of vendorData) {
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

  // 5. Seed Products (14)
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
    // Find existing product by vendorId and name or create
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

  // 6. Seed Packaging Units (16)
  const now = new Date();
  const futureExpiry = new Date(now.getTime() + 18 * 60 * 60 * 1000); // +18h
  const futureMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30d
  const pastExpiry = new Date(now.getTime() - 24 * 60 * 60 * 1000); // -24h

  const packagingData = [
    // 10 ACTIVE
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
    // 3 EXPIRED
    { qr: "DEMO-BREAKFAST-EXPIRED-003", pKey: "PROD-WR-05", batch: "BATCH-WR-2026-EXP", status: PackagingStatus.EXPIRED, expiry: pastExpiry },
    { qr: "DEMO-WATER-EXPIRED-011", pKey: "PROD-NR-02", batch: "BATCH-RN-2026-EXP9", status: PackagingStatus.EXPIRED, expiry: pastExpiry },
    { qr: "DEMO-UPMA-EXPIRED-012", pKey: "PROD-CR-14", batch: "BATCH-CR-2026-EXP3", status: PackagingStatus.EXPIRED, expiry: pastExpiry },
    // 3 RECALLED
    { qr: "DEMO-BIRYANI-RECALLED-004", pKey: "PROD-SR-08", batch: "BATCH-SR-2026-RECALL-9", status: PackagingStatus.RECALLED, expiry: futureExpiry },
    { qr: "DEMO-FISH-RECALLED-013", pKey: "PROD-ER-11", batch: "BATCH-ER-2026-REC2", status: PackagingStatus.RECALLED, expiry: futureExpiry },
    { qr: "DEMO-THALI-RECALLED-014", pKey: "PROD-NR-01", batch: "BATCH-NR-2026-REC5", status: PackagingStatus.RECALLED, expiry: futureExpiry },
  ];

  const packUnits = new Map<string, { id: string; qrCodeIdentifier: string }>();
  for (const pkg of packagingData) {
    const prod = products.get(pkg.pKey)!;
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

  // 7. Seed 35 Synthetic Complaints across all 8 Statuses
  // Breakdown:
  // 1-6: SUBMITTED (6)
  // 7-11: UNDER_REVIEW (5)
  // 12-17: INVESTIGATION (6)
  // 18-22: ACTION_REQUIRED (5)
  // 23-25: NEEDS_INFORMATION (3)
  // 26-30: RESOLVED (5)
  // 31-33: REJECTED (3)
  // 34-35: DUPLICATE (2)
  // Total = 35

  const complaintFixtureSpecs = [
    // 1-6: SUBMITTED
    { idx: 1, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.HIGH, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "B4", desc: "Dal in the veg thali had an unmistakable sour odor and bubbly curdled texture." },
    { idx: 2, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.MEDIUM, train: "12951", station: "MMCT", pkg: "DEMO-THALI-ACTIVE-001", coach: "B2", desc: "Rice served with dinner was discolored and smelled stale." },
    { idx: 3, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.CRITICAL, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "A1", desc: "Paneer curry was visibly spoiled with separating greenish oil film." },
    { idx: 4, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.LOW, train: "12004", station: "CNB", pkg: "DEMO-WATER-ACTIVE-002", coach: "C1", desc: "Drinking water bottle was warm and exposed to direct sun on platform trolley." },
    { idx: 5, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.MEDIUM, train: "22436", station: "CNB", pkg: "DEMO-SAMOSA-ACTIVE-004", coach: "E2", desc: "Snack box seal was partially torn when received from the pantry vendor." },
    { idx: 6, status: ComplaintStatus.SUBMITTED, cat: ComplaintCategory.PRODUCT_MISMATCH, sev: ComplaintSeverity.LOW, train: "12301", station: "HWH", pkg: "DEMO-THEPLA-ACTIVE-006", coach: "B8", desc: "Delivered snack box was labeled vegetarian but contained an unlabeled gravy container." },

    // 7-11: UNDER_REVIEW
    { idx: 7, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S3", desc: "Found small stone grit in curd rice portion while eating." },
    { idx: 8, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S4", desc: "Second stone fragment discovered in the same coach batch." },
    { idx: 9, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.CRITICAL, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S2", desc: "Hard plastic bristle detected inside curd rice cup." },
    { idx: 10, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.MEDIUM, train: "12137", station: "BSL", pkg: "DEMO-KHICHDI-ACTIVE-010", coach: "A2", desc: "Aluminium lid was punctured with gravy leaking onto cardboard tray." },
    { idx: 11, status: ComplaintStatus.UNDER_REVIEW, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.LOW, train: "12951", station: "MMCT", pkg: "DEMO-NVBIRYANI-ACTIVE-007", coach: "B5", desc: "Meal tray served lukewarm with coagulated fat layers." },

    // 12-17: INVESTIGATION
    { idx: 12, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.CRITICAL, train: "12004", station: "NDLS", pkg: "DEMO-PANEER-ACTIVE-003", coach: "C3", desc: "Paneer meal spoiled; multiple passengers reported foul odor before departure." },
    { idx: 13, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.HIGH, train: "12004", station: "CNB", pkg: "DEMO-IDLI-ACTIVE-005", coach: "C5", desc: "Pantry car ambient storage at 38C; cold chain protocol completely breached." },
    { idx: 14, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.MEDIUM, train: "12951", station: "MMCT", pkg: "DEMO-NVBIRYANI-ACTIVE-007", coach: "B1", desc: "Sub-zero chilled container served straight without reheating in pantry oven." },
    { idx: 15, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.HIGH, train: "12951", station: "MMCT", pkg: "DEMO-NVBIRYANI-ACTIVE-007", coach: "B3", desc: "Lukewarm core temperature in chicken pieces; food safety hazard." },
    { idx: 16, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.MEDIUM, train: "12951", station: "MMCT", pkg: "DEMO-NVBIRYANI-ACTIVE-007", coach: "A3", desc: "Pantry oven non-functional; meal handed over cold to passenger." },
    { idx: 17, status: ComplaintStatus.INVESTIGATION, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.HIGH, train: "12301", station: "HWH", pkg: "DEMO-FISH-ACTIVE-009", coach: "B6", desc: "Defective heat seal allowed air seepage during transit." },

    // 18-22: ACTION_REQUIRED
    { idx: 18, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "B7", desc: "Aluminium foil shard found in dal; confirmed from vendor sealing machine." },
    { idx: 19, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.HIGH, train: "12004", station: "NDLS", pkg: "DEMO-PANEER-ACTIVE-003", coach: "C2", desc: "Base kitchen packaging line failed cleanliness inspection." },
    { idx: 20, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.CRITICAL, train: "12301", station: "HWH", pkg: "DEMO-FISH-ACTIVE-009", coach: "A4", desc: "Confirmed bacterial spoilage due to delayed loading at Howrah platform." },
    { idx: 21, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.MEDIUM, train: "12137", station: "PUNE", pkg: "DEMO-KHICHDI-ACTIVE-010", coach: "B3", desc: "Thermostat sensor broken in pantry car warmer." },
    { idx: 22, status: ComplaintStatus.ACTION_REQUIRED, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.CRITICAL, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S1", desc: "Metal staple pin detected in pickle packet." },

    // 23-25: NEEDS_INFORMATION
    { idx: 23, status: ComplaintStatus.NEEDS_INFORMATION, cat: ComplaintCategory.PRODUCT_MISMATCH, sev: ComplaintSeverity.LOW, train: "22436", station: "CNB", pkg: "DEMO-SAMOSA-ACTIVE-004", coach: null, desc: "Passenger claims missing dessert item; coach number omitted in submission." },
    { idx: 24, status: ComplaintStatus.NEEDS_INFORMATION, cat: ComplaintCategory.OTHER, sev: ComplaintSeverity.LOW, train: "12301", station: null, pkg: null, coach: "B2", desc: "Unspecified taste complaint without packaging QR code or batch number." },
    { idx: 25, status: ComplaintStatus.NEEDS_INFORMATION, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.MEDIUM, train: "12951", station: "MMCT", pkg: "DEMO-THALI-ACTIVE-001", coach: "B4", desc: "Claim of dirty tray surface; image provided was blurry and inconclusive." },

    // 26-30: RESOLVED
    { idx: 26, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.HYGIENE_PACKAGING, sev: ComplaintSeverity.MEDIUM, train: "12137", station: "BSL", pkg: "DEMO-KHICHDI-ACTIVE-010", coach: "B2", desc: "Torn outer seal replaced immediately; vendor pantry staff completed sanitation audit." },
    { idx: 27, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.TEMPERATURE, sev: ComplaintSeverity.LOW, train: "12004", station: "CNB", pkg: "DEMO-IDLI-ACTIVE-005", coach: "C4", desc: "Pantry car microwave recalibrated; supervisor verified serving temperature." },
    { idx: 28, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.PRODUCT_MISMATCH, sev: ComplaintSeverity.LOW, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "A2", desc: "Incorrect thali swapped within 15 minutes by catering manager on train." },
    { idx: 29, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S5", desc: "Packaging line filter repaired; vendor completed mandatory staff retraining." },
    { idx: 30, status: ComplaintStatus.RESOLVED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.MEDIUM, train: "12301", station: "HWH", pkg: "DEMO-FISH-ACTIVE-009", coach: "B1", desc: "Batch quarantined at station depot; refund processed for affected passenger." },

    // 31-33: REJECTED
    { idx: 31, status: ComplaintStatus.REJECTED, cat: ComplaintCategory.OTHER, sev: ComplaintSeverity.LOW, train: "12951", station: "NDLS", pkg: null, coach: "B1", desc: "Passenger complaint asserting private vendor food was served on train." },
    { idx: 32, status: ComplaintStatus.REJECTED, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.LOW, train: "12004", station: "NDLS", pkg: "DEMO-WATER-ACTIVE-002", coach: "C1", desc: "Passenger claimed water tasted metallic; lab test verified within standard BIS limits." },
    { idx: 33, status: ComplaintStatus.REJECTED, cat: ComplaintCategory.PRODUCT_MISMATCH, sev: ComplaintSeverity.LOW, train: "22436", station: "CNB", pkg: "DEMO-SAMOSA-ACTIVE-004", coach: "E1", desc: "Claim of expired product refuted; packaging date was current and correctly labeled." },

    // 34-35: DUPLICATE
    { idx: 34, status: ComplaintStatus.DUPLICATE, cat: ComplaintCategory.SPOILAGE, sev: ComplaintSeverity.HIGH, train: "12951", station: "NDLS", pkg: "DEMO-THALI-ACTIVE-001", coach: "B4", desc: "Duplicate submission of complaint RG-2026-0001 from same seat by co-passenger." },
    { idx: 35, status: ComplaintStatus.DUPLICATE, cat: ComplaintCategory.FOREIGN_OBJECT, sev: ComplaintSeverity.HIGH, train: "12621", station: "MAS", pkg: "DEMO-CURDRICE-ACTIVE-008", coach: "S3", desc: "Duplicate entry of stone grit report RG-2026-0007." },
  ];

  const complaints = new Map<number, { id: string; complaintRef: string }>();

  for (const c of complaintFixtureSpecs) {
    const ref = `RG-2026-${String(c.idx).padStart(4, "0")}`;
    const rawToken = `TOKEN-DEMO-RG-2026-${String(c.idx).padStart(4, "0")}`;
    const tokenHash = hashTrackingToken(rawToken);

    const train = c.train ? trains.get(c.train) : null;
    const station = c.station ? stations.get(c.station) : null;
    const pkgUnit = c.pkg ? packUnits.get(c.pkg) : null;

    const rejectionReason =
      c.status === ComplaintStatus.REJECTED
        ? "Investigation confirmed allegation disproven by objective inspection and laboratory testing."
        : null;

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
        contactEmail: `passenger${c.idx}@demo.railguard.test`,
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
          explanation: "Complaint submitted by passenger via QR code scanning portal.",
          isPublic: true,
          createdAt: new Date(now.getTime() - (c.idx + 1) * 3600 * 1000),
        },
      });

      // Progression events if moved beyond SUBMITTED
      if (c.status !== ComplaintStatus.SUBMITTED) {
        await prisma.complaintEvent.create({
          data: {
            complaintId: complaint.id,
            actorId: reviewerUser.id,
            actorRole: UserRole.QUALITY_REVIEWER,
            previousStatus: ComplaintStatus.SUBMITTED,
            newStatus: c.status,
            explanation: `Case transitioned to ${c.status} following operational review protocol.`,
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

  // 8. Seed Investigations (8)
  const investigationSpecs = [
    { cIdx: 12, det: InvestigationDetermination.VENDOR_FAULT, findings: "Physical inspection of base kitchen confirmed refrigerator compressor malfunction during transit.", done: false },
    { cIdx: 13, det: InvestigationDetermination.STORAGE_FAULT, findings: "Pantry car ambient storage at 38C; cold chain protocol violated during transit.", done: false },
    { cIdx: 14, det: InvestigationDetermination.INCONCLUSIVE, findings: "Laboratory microbiological swab tests within permissible limits; further monitoring ordered.", done: false },
    { cIdx: 15, det: null, findings: "Preliminary review initiated; awaiting lab culture report from divisional laboratory.", done: false },
    { cIdx: 16, det: null, findings: "Inspector dispatched to boarding station base kitchen for surprise audit.", done: false },
    { cIdx: 17, det: InvestigationDetermination.VENDOR_FAULT, findings: "Batch packaging seal inspection showed defective heat-sealing calibration on production line.", done: false },
    { cIdx: 18, det: InvestigationDetermination.VENDOR_FAULT, findings: "Foreign object confirmed as packaging foil shard. Vendor kitchen hygiene warning issued.", done: false },
    { cIdx: 26, det: InvestigationDetermination.VENDOR_FAULT, findings: "Vendor completed deep sanitization and staff retraining. Inspection verified satisfactory.", done: true },
  ];

  const investigations = new Map<number, { id: string }>();
  for (const inv of investigationSpecs) {
    const comp = complaints.get(inv.cIdx)!;
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

  // 9. Seed Corrective Actions (5)
  // Mutually exclusive statuses, each counted exactly once
  const actionSpecs = [
    {
      cIdx: 18, // Investigation on Complaint 18
      type: CorrectiveActionType.WARNING_LETTER,
      resp: "Northern Rail Caterers Pvt Ltd",
      desc: "Formal warning letter issued regarding foil contamination in dal preparation line.",
      status: CorrectiveActionStatus.PENDING,
      deadline: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      verOut: null,
      verAt: null,
    },
    {
      cIdx: 12, // Investigation on Complaint 12
      type: CorrectiveActionType.KITCHEN_AUDIT,
      resp: "Western Gourmet Express Catering",
      desc: "Comprehensive HACCP base kitchen sanitization and cold-chain compliance audit.",
      status: CorrectiveActionStatus.IN_PROGRESS,
      deadline: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
      verOut: null,
      verAt: null,
    },
    {
      cIdx: 26, // Investigation on Complaint 26 (RESOLVED)
      type: CorrectiveActionType.STAFF_RETRAINING,
      resp: "Central Express Meals Ltd",
      desc: "Mandatory food hygiene and personal sanitation retraining for 25 pantry crew members.",
      status: CorrectiveActionStatus.VERIFIED_COMPLETE,
      deadline: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
      verOut: "SATISFACTORY: Full training roster and certificates verified by Senior Inspector.",
      verAt: new Date(now.getTime() - 24 * 3600 * 1000),
    },
    {
      cIdx: 13, // Investigation on Complaint 13
      type: CorrectiveActionType.FINANCIAL_PENALTY,
      resp: "Southern Hospitality Pantries",
      desc: "Imposition of INR 25,000 contractual penalty for repeated cold chain failure.",
      status: CorrectiveActionStatus.NON_COMPLIANT,
      deadline: new Date(now.getTime() - 3 * 24 * 3600 * 1000),
      verOut: "UNSATISFACTORY: Vendor failed to remit penalty by deadline.",
      verAt: null,
    },
    {
      cIdx: 17, // Investigation on Complaint 17
      type: CorrectiveActionType.BATCH_RECALL,
      resp: "Eastern Railway Base Kitchens",
      desc: "Recall and quarantine of batch BATCH-ER-2026-31A due to defective heat seals.",
      status: CorrectiveActionStatus.ESCALATED,
      deadline: new Date(now.getTime() + 2 * 24 * 3600 * 1000),
      verOut: null,
      verAt: null,
    },
  ];

  for (const act of actionSpecs) {
    const inv = investigations.get(act.cIdx)!;
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
          verifiedById: act.verAt ? adminUser.id : null,
        },
      });
    }
  }

  // 10. Seed Recurring Issue Alerts (3)
  const alertSpecs = [
    {
      vCode: "VND-NR-001",
      pKey: "PROD-NR-01",
      cat: ComplaintCategory.SPOILAGE,
      trigger: 3,
      window: 48,
      status: AlertStatus.OPEN,
      reason: "Automated Alert: 3 Spoilage allegations recorded within 48 hours for Northern Rail Caterers.",
      cIndices: [1, 2, 3],
    },
    {
      vCode: "VND-SR-003",
      pKey: "PROD-SR-08",
      cat: ComplaintCategory.FOREIGN_OBJECT,
      trigger: 3,
      window: 48,
      status: AlertStatus.ACKNOWLEDGED,
      reason: "Automated Alert: 3 Foreign object allegations flagged in pantry meal boxes.",
      cIndices: [7, 8, 9],
    },
    {
      vCode: "VND-WR-002",
      pKey: "PROD-WR-07",
      cat: ComplaintCategory.TEMPERATURE,
      trigger: 4,
      window: 72,
      status: AlertStatus.INVESTIGATED,
      reason: "System Audit Alert: 4 sub-standard temperature reports across Western Railway pantry services.",
      cIndices: [14, 15, 16, 17],
    },
  ];

  for (const a of alertSpecs) {
    const vendor = vendors.get(a.vCode)!;
    const prod = products.get(a.pKey)!;

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
      const comp = complaints.get(cIdx)!;
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

  // Count final verified records
  const summary: SeedSummary = {
    users: await prisma.user.count(),
    stations: await prisma.station.count(),
    trains: await prisma.train.count(),
    vendors: await prisma.vendor.count(),
    products: await prisma.product.count(),
    packagingUnits: await prisma.packagingUnit.count(),
    complaints: await prisma.complaint.count(),
    investigations: await prisma.investigation.count(),
    correctiveActions: await prisma.correctiveAction.count(),
    recurringAlerts: await prisma.recurringIssueAlert.count(),
  };

  console.log("[RailGuard Seeder] Demonstration fixture synchronization complete.");
  console.log(JSON.stringify(summary, null, 2));

  return summary;
}
