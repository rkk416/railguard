import React from "react";
import { getControlRoomMetrics, ControlRoomMetrics } from "@/services/dashboardMetricsService";
import { queryComplaints, ComplaintFilterParams, PaginatedComplaintsResult } from "@/services/complaintQueryService";
import { getRecurringIssueAlerts, RecurringAlertSummary } from "@/services/recurringAlertService";
import { getOperationalAnalytics, OperationalAnalyticsData } from "@/services/analyticsService";
import { MetricsHeader } from "@/components/dashboard/MetricsHeader";
import { ComplaintTriageQueue } from "@/components/dashboard/ComplaintTriageQueue";
import { RecurringAlertsPanel } from "@/components/dashboard/RecurringAlertsPanel";
import { OperationalAnalyticsView } from "@/components/dashboard/OperationalAnalyticsView";
import { Radio, Database } from "lucide-react";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{
    status?: string;
    category?: string;
    severity?: string;
    search?: string;
    page?: string;
    pageSize?: string;
    sort?: "asc" | "desc";
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;

  const queryParams: ComplaintFilterParams = {
    status: params.status,
    category: params.category,
    severity: params.severity,
    search: params.search,
    page: params.page ? parseInt(params.page, 10) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize, 10) : 10,
    sortOrder: params.sort === "asc" ? "asc" : "desc",
  };

  let metrics: ControlRoomMetrics = {
    totalActiveCases: 0,
    urgentSpoilageCases: 0,
    overdueInvestigations: 0,
    overdueCorrectiveActions: 0,
    totalResolved: 0,
    duplicateCount: 0,
    rejectedCount: 0,
    vendorComplianceRate: 100,
    complianceBreakdown: {
      satisfactory: 0,
      nonCompliant: 0,
      escalated: 0,
      overdueUncompleted: 0,
      denominator: 0,
    },
    totalComplaints: 0,
    activeAlertsCount: 0,
    generatedAt: new Date().toISOString(),
  };

  let complaintsResult: PaginatedComplaintsResult = {
    items: [],
    pagination: {
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    },
    filterSummary: {},
  };

  let alerts: RecurringAlertSummary[] = [];
  let analytics: OperationalAnalyticsData = {
    totalComplaints: 0,
    categoryDistribution: [],
    severityDistribution: [],
    topTrains: [],
    topStations: [],
    vendorPerformance: [],
    generatedAt: new Date().toISOString(),
  };

  let dbError: string | null = null;

  try {
    const [fetchedMetrics, fetchedComplaints, fetchedAlerts, fetchedAnalytics] = await Promise.all([
      getControlRoomMetrics(),
      queryComplaints(queryParams),
      getRecurringIssueAlerts(),
      getOperationalAnalytics(),
    ]);

    metrics = fetchedMetrics;
    complaintsResult = fetchedComplaints;
    alerts = fetchedAlerts;
    analytics = fetchedAnalytics;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    dbError = msg.includes("connect")
      ? "PostgreSQL database is currently offline. Start the database to inspect live records."
      : "An error occurred retrieving operational data.";
    console.error("[DashboardPage] DB query error:", msg);
  }

  return (
    <div className="space-y-6">
      {/* Title & Status Strip */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: "var(--paper-mid)" }}
      >
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold font-serif tracking-tight flex items-center gap-2"
            style={{ color: "var(--rail-ink)" }}
          >
            Railway Food Quality Oversight Register
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
            Indian Railways Passenger Feedback &amp; Catering Contractor Audit Console.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
          <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>{dbError ? "Offline" : "PostgreSQL 16+ Active"}</span>
          <span style={{ color: "var(--paper-mid)" }}>•</span>
          <span>{new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} IST</span>
        </div>
      </div>

      {/* Database Error Banner if offline */}
      {dbError && (
        <div
          className="rounded-lg border p-4 flex items-start gap-3"
          style={{
            backgroundColor: "rgba(198,95,72,0.06)",
            borderColor: "rgba(198,95,72,0.3)",
          }}
        >
          <Database className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--signal-red)" }} />
          <div>
            <div className="font-semibold text-xs" style={{ color: "var(--signal-red)" }}>
              Database Connectivity Notice
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
              {dbError} Run:{" "}
              <code
                className="px-1.5 py-0.5 rounded font-mono text-[11px]"
                style={{ backgroundColor: "var(--paper-mid)" }}
              >
                pg_ctl start -D .pgdata
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Operational Metrics Cards */}
      <MetricsHeader metrics={metrics} />

      {/* Recurring Issue Alerts Section */}
      <RecurringAlertsPanel initialAlerts={alerts} />

      {/* Operational Analytics & Quality Trends */}
      <OperationalAnalyticsView analytics={analytics} />

      {/* Triage Queue Table */}
      <ComplaintTriageQueue initialData={complaintsResult} />
    </div>
  );
}
