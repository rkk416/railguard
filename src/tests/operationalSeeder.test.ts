import { describe, it, expect, vi } from "vitest";
import { PrismaClient, UserRole } from "@prisma/client";
import { seedRailGuardData } from "@/services/seedData";

describe("Operational Seeding Engine (seedRailGuardData)", () => {
  it("supports dryRun mode returning accurate baseline metrics without DB mutations", async () => {
    // Create dummy client
    const dummyPrisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({
          id: "admin-1",
          email: "admin@railguard.gov.in",
          name: "System Admin",
          role: UserRole.ADMIN,
        }),
      },
      station: { upsert: vi.fn() },
      train: { upsert: vi.fn() },
      vendor: { upsert: vi.fn() },
      product: { upsert: vi.fn() },
      packagingUnit: { upsert: vi.fn() },
      complaint: { findUnique: vi.fn(), create: vi.fn() },
      investigation: { findUnique: vi.fn(), create: vi.fn() },
      correctiveAction: { findUnique: vi.fn(), create: vi.fn() },
      recurringAlert: { upsert: vi.fn() },
    } as unknown as PrismaClient;

    const summary = await seedRailGuardData(dummyPrisma, { dryRun: true });

    // Verify baseline dataset counts
    expect(summary.stations).toBe(8);
    expect(summary.trains).toBe(6);
    expect(summary.vendors).toBe(7);
    expect(summary.products).toBe(14);
    expect(summary.packagingUnits).toBe(20);
    expect(summary.complaints).toBe(35);
    expect(summary.investigations).toBe(12);
    expect(summary.correctiveActions).toBe(10);
    expect(summary.recurringAlerts).toBe(4);

    // Verify no upsert or create calls were made
    expect(dummyPrisma.station.upsert).not.toHaveBeenCalled();
    expect(dummyPrisma.train.upsert).not.toHaveBeenCalled();
    expect(dummyPrisma.vendor.upsert).not.toHaveBeenCalled();
    expect(dummyPrisma.product.upsert).not.toHaveBeenCalled();
    expect(dummyPrisma.packagingUnit.upsert).not.toHaveBeenCalled();
  });
});
