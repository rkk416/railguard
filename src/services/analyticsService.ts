import { prisma } from "@/lib/db/prisma";
import { ComplaintCategory, ComplaintSeverity } from "@prisma/client";

export interface CategoryDistribution {
  category: ComplaintCategory;
  label: string;
  count: number;
  percentage: number;
}

export interface SeverityDistribution {
  severity: ComplaintSeverity;
  count: number;
}

export interface RouteHotspot {
  trainNumber: string;
  trainName: string;
  count: number;
}

export interface StationHotspot {
  stationCode: string;
  stationName: string;
  count: number;
}

export interface VendorPerformance {
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  complaintCount: number;
  totalCorrectiveActions: number;
  verifiedSatisfactoryActions: number;
}

export interface OperationalAnalyticsData {
  totalComplaints: number;
  categoryDistribution: CategoryDistribution[];
  severityDistribution: SeverityDistribution[];
  topTrains: RouteHotspot[];
  topStations: StationHotspot[];
  vendorPerformance: VendorPerformance[];
  generatedAt: string;
}

export async function getOperationalAnalytics(): Promise<OperationalAnalyticsData> {
  const [
    totalComplaints,
    categoryGroups,
    severityGroups,
    trainComplaints,
    stationComplaints,
    vendors,
  ] = await Promise.all([
    prisma.complaint.count({ where: { deletedAt: null } }),

    prisma.complaint.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),

    prisma.complaint.groupBy({
      by: ["severity"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),

    prisma.complaint.findMany({
      where: { deletedAt: null, trainId: { not: null } },
      select: {
        train: { select: { trainNumber: true, trainName: true } },
      },
    }),

    prisma.complaint.findMany({
      where: { deletedAt: null, stationId: { not: null } },
      select: {
        station: { select: { code: true, name: true } },
      },
    }),

    prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        products: {
          select: {
            packagingUnits: {
              select: {
                complaints: {
                  where: { deletedAt: null },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  // 1. Category Distribution
  const categoryDistribution: CategoryDistribution[] = Object.keys(ComplaintCategory).map((cat) => {
    const found = categoryGroups.find((g) => g.category === cat);
    const count = found ? found._count._all : 0;
    const percentage = totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0;
    return {
      category: cat as ComplaintCategory,
      label: cat.replace("_", " "),
      count,
      percentage,
    };
  }).sort((a, b) => b.count - a.count);

  // 2. Severity Distribution
  const severityDistribution: SeverityDistribution[] = Object.keys(ComplaintSeverity).map((sev) => {
    const found = severityGroups.find((g) => g.severity === sev);
    return {
      severity: sev as ComplaintSeverity,
      count: found ? found._count._all : 0,
    };
  });

  // 3. Top Trains
  const trainCountMap = new Map<string, { trainName: string; count: number }>();
  for (const c of trainComplaints) {
    if (c.train) {
      const existing = trainCountMap.get(c.train.trainNumber) || { trainName: c.train.trainName, count: 0 };
      existing.count += 1;
      trainCountMap.set(c.train.trainNumber, existing);
    }
  }
  const topTrains: RouteHotspot[] = Array.from(trainCountMap.entries())
    .map(([trainNumber, data]) => ({
      trainNumber,
      trainName: data.trainName,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Top Stations
  const stationCountMap = new Map<string, { stationName: string; count: number }>();
  for (const c of stationComplaints) {
    if (c.station) {
      const existing = stationCountMap.get(c.station.code) || { stationName: c.station.name, count: 0 };
      existing.count += 1;
      stationCountMap.set(c.station.code, existing);
    }
  }
  const topStations: StationHotspot[] = Array.from(stationCountMap.entries())
    .map(([stationCode, data]) => ({
      stationCode,
      stationName: data.stationName,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 5. Vendor Performance
  const correctiveActions = await prisma.correctiveAction.findMany({
    select: {
      responsibleParty: true,
      status: true,
    },
  });

  const vendorPerformance: VendorPerformance[] = vendors.map((v) => {
    let complaintCount = 0;
    for (const p of v.products) {
      for (const pu of p.packagingUnits) {
        complaintCount += pu.complaints.length;
      }
    }

    const vendorActions = correctiveActions.filter(
      (a) => a.responsibleParty?.includes(v.code) || a.responsibleParty?.includes(v.name)
    );
    const verifiedSatisfactoryActions = vendorActions.filter(
      (a) => a.status === "VERIFIED_COMPLETE"
    ).length;

    return {
      vendorId: v.id,
      vendorName: v.name,
      vendorCode: v.code,
      complaintCount,
      totalCorrectiveActions: vendorActions.length,
      verifiedSatisfactoryActions,
    };
  }).sort((a, b) => b.complaintCount - a.complaintCount);

  return {
    totalComplaints,
    categoryDistribution,
    severityDistribution,
    topTrains,
    topStations,
    vendorPerformance,
    generatedAt: new Date().toISOString(),
  };
}
