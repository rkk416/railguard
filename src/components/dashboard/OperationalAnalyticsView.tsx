"use client";

import React from "react";
import { OperationalAnalyticsData } from "@/services/analyticsService";
import {
  BarChart3,
  TrendingUp,
  Train,
  MapPin,
  Building2,
  PieChart,
} from "lucide-react";

interface OperationalAnalyticsViewProps {
  analytics: OperationalAnalyticsData;
}

export function OperationalAnalyticsView({ analytics }: OperationalAnalyticsViewProps) {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "SPOILAGE":
        return "var(--signal-red)";
      case "FOREIGN_OBJECT":
        return "#b26a28";
      case "HYGIENE_PACKAGING":
        return "var(--brass)";
      case "TEMPERATURE":
        return "var(--jade)";
      case "PRODUCT_MISMATCH":
        return "var(--rail-ink)";
      default:
        return "var(--ink-faint)";
    }
  };

  return (
    <div
      className="rounded-lg border p-5 shadow-xs space-y-6"
      style={{
        backgroundColor: "white",
        borderColor: "var(--paper-mid)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between pb-3 border-b"
        style={{ borderColor: "var(--paper-mid)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: "rgba(82, 124, 114, 0.12)",
              color: "var(--jade)",
            }}
          >
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif flex items-center gap-2" style={{ color: "var(--rail-ink)" }}>
              <span>Operational Analytics &amp; Quality Trends</span>
            </h3>
            <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              Aggregated from {analytics.totalComplaints} complaints across active operational routes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "var(--jade)" }}>
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Real-Time Audit Metrics</span>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Incident Distribution by Category */}
        <div
          className="rounded border p-4 space-y-3"
          style={{
            backgroundColor: "var(--archive-paper)",
            borderColor: "var(--paper-mid)",
          }}
        >
          <div className="flex items-center justify-between">
            <h4
              className="text-xs font-bold flex items-center gap-1.5 uppercase font-mono tracking-wider"
              style={{ color: "var(--rail-ink)" }}
            >
              <PieChart className="w-3.5 h-3.5" style={{ color: "var(--jade)" }} />
              <span>Complaints by Category</span>
            </h4>
            <span className="text-[10px] font-mono" style={{ color: "var(--ink-faint)" }}>
              {analytics.totalComplaints} Total Cases
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {analytics.categoryDistribution.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium" style={{ color: "var(--rail-ink)" }}>
                    {item.label}
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: getCategoryColor(item.category),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Severity Breakdown Strip */}
          <div
            className="pt-3 border-t mt-3 flex items-center justify-between text-[11px] font-mono"
            style={{ borderColor: "var(--paper-mid)" }}
          >
            <span style={{ color: "var(--ink-faint)" }}>Severity Split:</span>
            <div className="flex items-center gap-2">
              {analytics.severityDistribution.map((sev) => (
                <span key={sev.severity} className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        sev.severity === "CRITICAL"
                          ? "var(--signal-red)"
                          : sev.severity === "HIGH"
                          ? "#b26a28"
                          : sev.severity === "MEDIUM"
                          ? "var(--brass)"
                          : "var(--ink-faint)",
                    }}
                  />
                  <span style={{ color: "var(--ink-muted)" }}>
                    {sev.severity[0]}: <strong>{sev.count}</strong>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Hotspots (Routes & Stations) */}
        <div
          className="rounded border p-4 space-y-4"
          style={{
            backgroundColor: "var(--archive-paper)",
            borderColor: "var(--paper-mid)",
          }}
        >
          {/* Top Train Routes */}
          <div>
            <h4
              className="text-xs font-bold flex items-center gap-1.5 uppercase font-mono tracking-wider mb-2.5"
              style={{ color: "var(--rail-ink)" }}
            >
              <Train className="w-3.5 h-3.5" style={{ color: "var(--brass)" }} />
              <span>Route Concentration Hotspots</span>
            </h4>
            <div className="space-y-1.5">
              {analytics.topTrains.length === 0 ? (
                <p className="text-xs font-mono" style={{ color: "var(--ink-faint)" }}>
                  No route concentration detected.
                </p>
              ) : (
                analytics.topTrains.slice(0, 4).map((t) => (
                  <div
                    key={t.trainNumber}
                    className="p-2 rounded border flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: "white",
                      borderColor: "var(--paper-mid)",
                    }}
                  >
                    <div>
                      <span className="font-mono font-bold mr-1.5" style={{ color: "var(--rail-ink)" }}>
                        {t.trainNumber}
                      </span>
                      <span style={{ color: "var(--ink-muted)" }}>{t.trainName}</span>
                    </div>
                    <span
                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: "#fdf8ee",
                        borderColor: "#ebd7a9",
                        color: "var(--brass)",
                      }}
                    >
                      {t.count} Cases
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Station Hotspots */}
          <div>
            <h4
              className="text-xs font-bold flex items-center gap-1.5 uppercase font-mono tracking-wider mb-2.5"
              style={{ color: "var(--rail-ink)" }}
            >
              <MapPin className="w-3.5 h-3.5" style={{ color: "var(--signal-red)" }} />
              <span>Station Incident Volume</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {analytics.topStations.slice(0, 4).map((s) => (
                <div
                  key={s.stationCode}
                  className="p-2 rounded border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: "white",
                    borderColor: "var(--paper-mid)",
                  }}
                >
                  <span className="font-mono font-bold" style={{ color: "var(--rail-ink)" }}>
                    {s.stationCode}
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    {s.count} {s.count === 1 ? "case" : "cases"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Contractor Compliance Scoreboard */}
      <div
        className="rounded border p-4 space-y-3"
        style={{
          backgroundColor: "var(--archive-paper)",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex items-center justify-between">
          <h4
            className="text-xs font-bold flex items-center gap-1.5 uppercase font-mono tracking-wider"
            style={{ color: "var(--rail-ink)" }}
          >
            <Building2 className="w-3.5 h-3.5" style={{ color: "var(--jade)" }} />
            <span>Authorized Catering Contractor Audit Ledger</span>
          </h4>
          <span className="text-[10px] font-mono" style={{ color: "var(--ink-faint)" }}>
            PostgreSQL Dynamic Calculation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b font-mono uppercase text-[10px] tracking-wider"
                style={{
                  borderColor: "var(--paper-mid)",
                  color: "var(--ink-muted)",
                }}
              >
                <th className="py-2 px-2.5">Contractor</th>
                <th className="py-2 px-2.5">Code</th>
                <th className="py-2 px-2.5 text-center">Complaints</th>
                <th className="py-2 px-2.5 text-center">Corrective Mandates</th>
                <th className="py-2 px-2.5 text-right">Satisfactory Resolutions</th>
              </tr>
            </thead>
            <tbody className="divide-y font-sans" style={{ borderColor: "var(--paper-mid)" }}>
              {analytics.vendorPerformance.map((v) => (
                <tr key={v.vendorId} className="register-row">
                  <td className="py-2.5 px-2.5 font-medium" style={{ color: "var(--rail-ink)" }}>
                    {v.vendorName}
                  </td>
                  <td className="py-2.5 px-2.5 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    {v.vendorCode}
                  </td>
                  <td className="py-2.5 px-2.5 text-center font-mono" style={{ color: "var(--rail-ink)" }}>
                    {v.complaintCount}
                  </td>
                  <td className="py-2.5 px-2.5 text-center font-mono" style={{ color: "var(--rail-ink)" }}>
                    {v.totalCorrectiveActions}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono" style={{ color: "var(--jade)" }}>
                    <strong>{v.verifiedSatisfactoryActions}</strong> Verified
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
