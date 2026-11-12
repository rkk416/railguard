import { prisma } from "@/lib/db/prisma";
import {
  ComplaintStatus,
  ComplaintCategory,
  ComplaintSeverity,
  Prisma,
} from "@prisma/client";

export interface ComplaintFilterParams {
  status?: string;
  category?: string;
  severity?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "severity";
  sortOrder?: "asc" | "desc";
}

export interface ComplaintSummaryItem {
  id: string;
  complaintRef: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  description: string;
  coach: string | null;
  journeyDate: Date | null;
  createdAt: Date;
  train: {
    id: string;
    trainNumber: string;
    trainName: string;
  } | null;
  unmatchedTrainNumber: string | null;
  station: {
    id: string;
    code: string;
    name: string;
  } | null;
  packagingUnit: {
    id: string;
    qrCodeIdentifier: string;
    batchNumber: string;
    product: {
      name: string;
      vendor: {
        code: string;
        name: string;
      };
    };
  } | null;
  evidenceCount: number;
  eventCount: number;
  hasInvestigation: boolean;
}

export interface PaginatedComplaintsResult {
  items: ComplaintSummaryItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  filterSummary: {
    status?: string;
    category?: string;
    severity?: string;
    search?: string;
  };
}

/**
 * Queries complaints with operational filters, search, sorting, and pagination.
 * Strict exclusion of soft-deleted records.
 */
export async function queryComplaints(
  params: ComplaintFilterParams = {}
): Promise<PaginatedComplaintsResult> {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(params.pageSize) || 10));
  const skip = (page - 1) * pageSize;

  const where: Prisma.ComplaintWhereInput = {
    deletedAt: null, // Exclude soft-deleted
  };

  // Status Filter
  if (params.status && params.status !== "ALL" && params.status in ComplaintStatus) {
    where.status = params.status as ComplaintStatus;
  }

  // Category Filter
  if (params.category && params.category !== "ALL" && params.category in ComplaintCategory) {
    where.category = params.category as ComplaintCategory;
  }

  // Severity Filter
  if (params.severity && params.severity !== "ALL" && params.severity in ComplaintSeverity) {
    where.severity = params.severity as ComplaintSeverity;
  }

  // Search Filter
  if (params.search && params.search.trim().length > 0) {
    const s = params.search.trim();
    where.OR = [
      { complaintRef: { contains: s, mode: "insensitive" } },
      { description: { contains: s, mode: "insensitive" } },
      { unmatchedTrainNumber: { contains: s, mode: "insensitive" } },
      { coach: { contains: s, mode: "insensitive" } },
      { train: { trainNumber: { contains: s, mode: "insensitive" } } },
      { train: { trainName: { contains: s, mode: "insensitive" } } },
      { station: { code: { contains: s, mode: "insensitive" } } },
      { station: { name: { contains: s, mode: "insensitive" } } },
      { packagingUnit: { qrCodeIdentifier: { contains: s, mode: "insensitive" } } },
      { packagingUnit: { batchNumber: { contains: s, mode: "insensitive" } } },
    ];
  }

  // Order By
  const orderBy: Prisma.ComplaintOrderByWithRelationInput = {};
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";

  if (params.sortBy === "severity") {
    orderBy.severity = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  // Execute Count & Data Queries
  const [total, records] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        train: {
          select: { id: true, trainNumber: true, trainName: true },
        },
        station: {
          select: { id: true, code: true, name: true },
        },
        packagingUnit: {
          select: {
            id: true,
            qrCodeIdentifier: true,
            batchNumber: true,
            product: {
              select: {
                name: true,
                vendor: { select: { code: true, name: true } },
              },
            },
          },
        },
        _count: {
          select: {
            evidence: true,
            events: true,
          },
        },
        investigation: {
          select: { id: true },
        },
      },
    }),
  ]);

  const items: ComplaintSummaryItem[] = records.map((r) => ({
    id: r.id,
    complaintRef: r.complaintRef,
    category: r.category,
    severity: r.severity,
    status: r.status,
    description: r.description,
    coach: r.coach,
    journeyDate: r.journeyDate,
    createdAt: r.createdAt,
    train: r.train,
    unmatchedTrainNumber: r.unmatchedTrainNumber,
    station: r.station,
    packagingUnit: r.packagingUnit,
    evidenceCount: r._count.evidence,
    eventCount: r._count.events,
    hasInvestigation: !!r.investigation,
  }));

  return {
    items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
    filterSummary: {
      status: params.status,
      category: params.category,
      severity: params.severity,
      search: params.search,
    },
  };
}
