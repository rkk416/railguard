import { describe, it, expect, vi, beforeEach } from "vitest";
import { ComplaintCategory, ComplaintSeverity } from "@prisma/client";

const mockCount = vi.fn();
const mockGroupBy = vi.fn();
const mockFindManyComplaints = vi.fn();
const mockFindManyVendors = vi.fn();
const mockFindManyActions = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    complaint: {
      count: (...args: unknown[]) => mockCount(...args),
      groupBy: (...args: unknown[]) => mockGroupBy(...args),
      findMany: (...args: unknown[]) => mockFindManyComplaints(...args),
    },
    vendor: {
      findMany: (...args: unknown[]) => mockFindManyVendors(...args),
    },
    correctiveAction: {
      findMany: (...args: unknown[]) => mockFindManyActions(...args),
    },
  },
}));

import { getOperationalAnalytics } from "@/services/analyticsService";

describe("Operational Analytics & Trend Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates category percentages and severity distributions correctly", async () => {
    mockCount.mockResolvedValueOnce(20); // total 20 complaints

    // Category groupBy: 10 SPOILAGE, 5 FOREIGN_OBJECT, 5 HYGIENE_PACKAGING
    mockGroupBy
      .mockResolvedValueOnce([
        { category: ComplaintCategory.SPOILAGE, _count: { _all: 10 } },
        { category: ComplaintCategory.FOREIGN_OBJECT, _count: { _all: 5 } },
        { category: ComplaintCategory.HYGIENE_PACKAGING, _count: { _all: 5 } },
      ])
      // Severity groupBy: 4 CRITICAL, 8 HIGH, 6 MEDIUM, 2 LOW
      .mockResolvedValueOnce([
        { severity: ComplaintSeverity.CRITICAL, _count: { _all: 4 } },
        { severity: ComplaintSeverity.HIGH, _count: { _all: 8 } },
        { severity: ComplaintSeverity.MEDIUM, _count: { _all: 6 } },
        { severity: ComplaintSeverity.LOW, _count: { _all: 2 } },
      ]);

    // Train complaints
    mockFindManyComplaints
      .mockResolvedValueOnce([
        { train: { trainNumber: "12951", trainName: "Mumbai Rajdhani" } },
        { train: { trainNumber: "12951", trainName: "Mumbai Rajdhani" } },
        { train: { trainNumber: "12002", trainName: "Bhopal Shatabdi" } },
      ])
      // Station complaints
      .mockResolvedValueOnce([
        { station: { code: "NDLS", name: "New Delhi" } },
        { station: { code: "NDLS", name: "New Delhi" } },
        { station: { code: "MMCT", name: "Mumbai Central" } },
      ]);

    // Vendors
    mockFindManyVendors.mockResolvedValueOnce([
      {
        id: "v-1",
        name: "Northern Caterers",
        code: "VND-NR-001",
        products: [
          { packagingUnits: [{ complaints: [{ id: "c-1" }, { id: "c-2" }] }] },
        ],
      },
    ]);

    // Actions
    mockFindManyActions.mockResolvedValueOnce([
      { responsibleParty: "VND-NR-001 Northern Caterers", status: "VERIFIED_COMPLETE" },
    ]);

    const analytics = await getOperationalAnalytics();

    expect(analytics.totalComplaints).toBe(20);

    const spoilage = analytics.categoryDistribution.find((c) => c.category === "SPOILAGE");
    expect(spoilage?.count).toBe(10);
    expect(spoilage?.percentage).toBe(50); // 10/20 = 50%

    expect(analytics.topTrains[0].trainNumber).toBe("12951");
    expect(analytics.topTrains[0].count).toBe(2);

    expect(analytics.topStations[0].stationCode).toBe("NDLS");
    expect(analytics.topStations[0].count).toBe(2);

    expect(analytics.vendorPerformance[0].vendorCode).toBe("VND-NR-001");
    expect(analytics.vendorPerformance[0].complaintCount).toBe(2);
    expect(analytics.vendorPerformance[0].verifiedSatisfactoryActions).toBe(1);
  });
});
