import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlertStatus, ComplaintCategory, UserRole } from "@prisma/client";

const mockFindManyAlerts = vi.fn();
const mockFindUniqueAlert = vi.fn();
const mockUpdateAlert = vi.fn();
const mockFindUniqueComplaint = vi.fn();
const mockFindManyComplaints = vi.fn();
const mockFindFirstAlert = vi.fn();
const mockCreateAlert = vi.fn();
const mockUpsertLink = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    recurringIssueAlert: {
      findMany: (...args: unknown[]) => mockFindManyAlerts(...args),
      findUnique: (...args: unknown[]) => mockFindUniqueAlert(...args),
      findFirst: (...args: unknown[]) => mockFindFirstAlert(...args),
      update: (...args: unknown[]) => mockUpdateAlert(...args),
      create: (...args: unknown[]) => mockCreateAlert(...args),
    },
    complaint: {
      findUnique: (...args: unknown[]) => mockFindUniqueComplaint(...args),
      findMany: (...args: unknown[]) => mockFindManyComplaints(...args),
    },
    recurringIssueAlertComplaint: {
      upsert: (...args: unknown[]) => mockUpsertLink(...args),
    },
  },
}));

import {
  getRecurringIssueAlerts,
  updateAlertStatus,
  evaluateRecurringIssue,
} from "@/services/recurringAlertService";

describe("Recurring Issue Detection & Alert Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves recurring issue alerts with vendor, product, and linked case counts", async () => {
    mockFindManyAlerts.mockResolvedValueOnce([
      {
        id: "alert-1",
        category: ComplaintCategory.SPOILAGE,
        triggerCount: 4,
        timeWindowHours: 48,
        reason: "Repeated spoilage in thali meals",
        status: AlertStatus.OPEN,
        createdAt: new Date("2026-11-08T10:00:00Z"),
        vendor: { id: "v-1", name: "Northern Caterers", code: "VND-NR-001" },
        product: { id: "p-1", name: "Standard Veg Thali" },
        complaintLinks: [
          { complaint: { complaintRef: "RG-2026-0001" } },
          { complaint: { complaintRef: "RG-2026-0002" } },
        ],
      },
    ]);

    const alerts = await getRecurringIssueAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].triggerCount).toBe(4);
    expect(alerts[0].triggeringComplaintsCount).toBe(2);
    expect(alerts[0].recentComplaintRefs).toEqual(["RG-2026-0001", "RG-2026-0002"]);
  });

  it("allows authorized quality reviewer to acknowledge an alert", async () => {
    mockFindUniqueAlert.mockResolvedValueOnce({ id: "alert-1", status: AlertStatus.OPEN });
    mockUpdateAlert.mockResolvedValueOnce({ id: "alert-1", status: AlertStatus.ACKNOWLEDGED });

    const result = await updateAlertStatus("alert-1", AlertStatus.ACKNOWLEDGED, UserRole.QUALITY_REVIEWER);
    expect(result.status).toBe(AlertStatus.ACKNOWLEDGED);
    expect(mockUpdateAlert).toHaveBeenCalledWith({
      where: { id: "alert-1" },
      data: { status: AlertStatus.ACKNOWLEDGED },
    });
  });

  it("prevents unauthorized actors from updating alert status", async () => {
    await expect(
      updateAlertStatus("alert-1", AlertStatus.DISMISSED, "PASSENGER" as unknown as UserRole)
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("evaluates complaints and creates an alert when 3+ matching complaints occur within 48h", async () => {
    mockFindUniqueComplaint.mockResolvedValueOnce({
      id: "comp-3",
      category: ComplaintCategory.SPOILAGE,
      packagingUnit: {
        productId: "prod-1",
        product: {
          vendorId: "vend-1",
          name: "Standard Veg Thali",
          vendor: { name: "Northern Caterers" },
        },
      },
    });

    mockFindManyComplaints.mockResolvedValueOnce([
      { id: "comp-1", complaintRef: "RG-2026-0001" },
      { id: "comp-2", complaintRef: "RG-2026-0002" },
      { id: "comp-3", complaintRef: "RG-2026-0003" },
    ]);

    mockFindFirstAlert.mockResolvedValueOnce(null); // No existing alert
    mockCreateAlert.mockResolvedValueOnce({
      id: "new-alert-uuid",
      category: ComplaintCategory.SPOILAGE,
      triggerCount: 3,
      status: AlertStatus.OPEN,
    });

    const alert = await evaluateRecurringIssue("comp-3");
    expect(alert).toBeDefined();
    expect(alert?.triggerCount).toBe(3);
    expect(mockCreateAlert).toHaveBeenCalledTimes(1);
    expect(mockUpsertLink).toHaveBeenCalledTimes(3); // Linked all 3 cases
  });

  it("does not create an alert if matching complaints are below threshold (< 3)", async () => {
    mockFindUniqueComplaint.mockResolvedValueOnce({
      id: "comp-2",
      category: ComplaintCategory.SPOILAGE,
      packagingUnit: {
        productId: "prod-1",
        product: { vendorId: "vend-1", name: "Thali", vendor: { name: "Caterers" } },
      },
    });

    mockFindManyComplaints.mockResolvedValueOnce([
      { id: "comp-1", complaintRef: "RG-2026-0001" },
      { id: "comp-2", complaintRef: "RG-2026-0002" },
    ]);

    const alert = await evaluateRecurringIssue("comp-2");
    expect(alert).toBeNull();
    expect(mockCreateAlert).not.toHaveBeenCalled();
  });
});
