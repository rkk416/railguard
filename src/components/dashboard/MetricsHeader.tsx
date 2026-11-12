import React from "react";
import { ControlRoomMetrics } from "@/services/dashboardMetricsService";
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert, Award, FileText } from "lucide-react";

interface MetricsHeaderProps {
  metrics: ControlRoomMetrics;
}

export function MetricsHeader({ metrics }: MetricsHeaderProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Active Cases */}
      <div
        className="rounded-lg border p-3.5"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex items-center justify-between mb-1.5" style={{ color: "var(--ink-muted)" }}>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
            Active Cases
          </span>
          <FileText className="w-4 h-4" style={{ color: "var(--jade)" }} />
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: "var(--rail-ink)" }}>
          {metrics.totalActiveCases}
        </div>
        <div className="text-[11px] font-mono mt-1 flex items-center gap-1.5" style={{ color: "var(--ink-faint)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--brass)" }} />
          <span>{metrics.totalComplaints} Total Logged</span>
        </div>
      </div>

      {/* 2. Urgent Spoilage Cases */}
      <div
        className="rounded-lg border p-3.5"
        style={{
          backgroundColor: "white",
          borderColor: "rgba(198,95,72,0.3)",
        }}
      >
        <div className="flex items-center justify-between mb-1.5" style={{ color: "var(--signal-red)" }}>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
            Urgent Spoilage
          </span>
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: "var(--signal-red)" }}>
          {metrics.urgentSpoilageCases}
        </div>
        <div className="text-[11px] font-mono mt-1 flex items-center gap-1.5" style={{ color: "var(--signal-red)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--signal-red)" }} />
          <span>High/Critical Hazard</span>
        </div>
      </div>

      {/* 3. Overdue Investigations */}
      <div
        className="rounded-lg border p-3.5"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex items-center justify-between mb-1.5" style={{ color: "var(--brass)" }}>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
            Overdue Inq.
          </span>
          <Clock className="w-4 h-4" />
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: "var(--brass)" }}>
          {metrics.overdueInvestigations}
        </div>
        <div className="text-[11px] font-mono mt-1" style={{ color: "var(--ink-faint)" }}>
          <span>&gt; 48h SLA Limit</span>
        </div>
      </div>

      {/* 4. Overdue Corrective Actions */}
      <div
        className="rounded-lg border p-3.5"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex items-center justify-between mb-1.5" style={{ color: "var(--signal-red)" }}>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
            Overdue Actions
          </span>
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: "var(--signal-red)" }}>
          {metrics.overdueCorrectiveActions}
        </div>
        <div className="text-[11px] font-mono mt-1" style={{ color: "var(--ink-faint)" }}>
          <span>Past Deadline</span>
        </div>
      </div>

      {/* 5. Total Resolved */}
      <div
        className="rounded-lg border p-3.5"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex items-center justify-between mb-1.5" style={{ color: "var(--jade)" }}>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
            Resolved
          </span>
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: "var(--jade)" }}>
          {metrics.totalResolved}
        </div>
        <div className="text-[11px] font-mono mt-1" style={{ color: "var(--ink-faint)" }}>
          <span>Verified Closed</span>
        </div>
      </div>

      {/* 6. Vendor Compliance Rate */}
      <div
        className="rounded-lg border p-3.5"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex items-center justify-between mb-1.5" style={{ color: "var(--jade)" }}>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
            Compliance
          </span>
          <Award className="w-4 h-4" />
        </div>
        <div className="text-2xl font-bold font-mono" style={{ color: "var(--rail-ink)" }}>
          {metrics.vendorComplianceRate !== null
            ? `${metrics.vendorComplianceRate}%`
            : "N/A"}
        </div>
        <div
          className="text-[11px] font-mono mt-1 truncate"
          style={{ color: "var(--ink-faint)" }}
          title={`Denominator: ${metrics.complianceBreakdown.denominator} actions`}
        >
          <span>
            {metrics.complianceBreakdown.satisfactory}/{metrics.complianceBreakdown.denominator} Verified
          </span>
        </div>
      </div>
    </div>
  );
}
