"use client";

import React, { useState } from "react";
import { RecurringAlertSummary } from "@/services/recurringAlertService";
import { AlertStatus } from "@prisma/client";
import {
  Bell,
  CheckCircle,
  Eye,
  XCircle,
  Package,
  Building2,
} from "lucide-react";

interface RecurringAlertsPanelProps {
  initialAlerts: RecurringAlertSummary[];
}

export function RecurringAlertsPanel({ initialAlerts }: RecurringAlertsPanelProps) {
  const [alerts, setAlerts] = useState<RecurringAlertSummary[]>(initialAlerts);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleStatusChange = async (alertId: string, newStatus: AlertStatus) => {
    setUpdatingId(alertId);
    setMessage(null);

    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update alert");
      }

      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
      );
      setMessage(`Alert updated to ${newStatus}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Error updating alert");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeStyle = (status: AlertStatus) => {
    switch (status) {
      case "OPEN":
        return { bg: "#fbf2ef", text: "#c65f48", border: "#ecc8be" };
      case "ACKNOWLEDGED":
        return { bg: "#fdf8ee", text: "#b28d55", border: "#ebd7a9" };
      case "INVESTIGATED":
        return { bg: "#f2f7f5", text: "#527c72", border: "#c2d9d2" };
      case "DISMISSED":
        return { bg: "#f0ede4", text: "#8a9490", border: "#e4e0d4" };
      default:
        return { bg: "#f0ede4", text: "#252d2b", border: "#e4e0d4" };
    }
  };

  const activeCount = alerts.filter((a) => a.status === "OPEN" || a.status === "ACKNOWLEDGED").length;

  return (
    <div
      className="rounded-lg border p-5 shadow-xs space-y-4"
      style={{
        backgroundColor: "white",
        borderColor: "var(--paper-mid)",
      }}
    >
      <div
        className="flex items-center justify-between pb-3 border-b"
        style={{ borderColor: "var(--paper-mid)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: "rgba(198, 95, 72, 0.12)",
              color: "var(--signal-red)",
            }}
          >
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif flex items-center gap-2" style={{ color: "var(--rail-ink)" }}>
              <span>Recurring Issue Alerts</span>
              <span
                className="px-2 py-0.5 rounded text-[11px] font-mono border"
                style={{
                  backgroundColor: "rgba(198, 95, 72, 0.08)",
                  color: "var(--signal-red)",
                  borderColor: "rgba(198, 95, 72, 0.2)",
                }}
              >
                {activeCount} Active
              </span>
            </h3>
            <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              Algorithmic pattern detection identifying 3+ complaints within 48h windows.
            </p>
          </div>
        </div>

        {message && (
          <span
            className="text-xs font-mono px-2 py-0.5 rounded border"
            style={{
              backgroundColor: "#f2f7f5",
              borderColor: "#c2d9d2",
              color: "var(--jade)",
            }}
          >
            {message}
          </span>
        )}
      </div>

      {/* Alert Cards Grid */}
      {alerts.length === 0 ? (
        <div
          className="p-6 text-center text-xs rounded border border-dashed"
          style={{ borderColor: "var(--paper-mid)", color: "var(--ink-faint)" }}
        >
          No recurring issue alerts currently registered.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((alert) => {
            const badgeStyle = getStatusBadgeStyle(alert.status);
            return (
              <div
                key={alert.id}
                className="p-3.5 rounded border space-y-2.5 transition-colors"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                      style={{
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.text,
                        borderColor: badgeStyle.border,
                      }}
                    >
                      {alert.status}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                      style={{
                        backgroundColor: "white",
                        borderColor: "var(--paper-mid)",
                        color: "var(--rail-ink)",
                      }}
                    >
                      {alert.category.replace("_", " ")}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono" style={{ color: "var(--ink-faint)" }}>
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: "var(--rail-ink)" }}>
                  {alert.reason}
                </p>

                {/* Entity Details */}
                <div
                  className="flex items-center gap-3 text-[11px] font-mono pt-1 border-t"
                  style={{
                    borderColor: "var(--paper-mid)",
                    color: "var(--ink-muted)",
                  }}
                >
                  {alert.vendor && (
                    <div className="flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 shrink-0" style={{ color: "var(--ink-faint)" }} />
                      <span className="truncate">{alert.vendor.name}</span>
                    </div>
                  )}
                  {alert.product && (
                    <div className="flex items-center gap-1 truncate">
                      <Package className="w-3 h-3 shrink-0" style={{ color: "var(--ink-faint)" }} />
                      <span className="truncate">{alert.product.name}</span>
                    </div>
                  )}
                  <div className="ml-auto shrink-0 font-bold" style={{ color: "var(--signal-red)" }}>
                    {alert.triggeringComplaintsCount} Cases
                  </div>
                </div>

                {/* Action Controls */}
                <div
                  className="flex items-center gap-1.5 pt-1 border-t text-[11px]"
                  style={{ borderColor: "var(--paper-mid)" }}
                >
                  <span className="text-[10px] font-mono uppercase" style={{ color: "var(--ink-faint)" }}>
                    Action:
                  </span>
                  {alert.status === "OPEN" && (
                    <button
                      type="button"
                      disabled={updatingId === alert.id}
                      onClick={() => handleStatusChange(alert.id, AlertStatus.ACKNOWLEDGED)}
                      className="px-2 py-0.5 rounded border font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: "white",
                        borderColor: "var(--paper-mid)",
                        color: "var(--brass)",
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      Acknowledge
                    </button>
                  )}
                  {(alert.status === "OPEN" || alert.status === "ACKNOWLEDGED") && (
                    <button
                      type="button"
                      disabled={updatingId === alert.id}
                      onClick={() => handleStatusChange(alert.id, AlertStatus.INVESTIGATED)}
                      className="px-2 py-0.5 rounded border font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: "white",
                        borderColor: "var(--paper-mid)",
                        color: "var(--jade)",
                      }}
                    >
                      <CheckCircle className="w-3 h-3" />
                      Mark Investigated
                    </button>
                  )}
                  {alert.status !== "DISMISSED" && (
                    <button
                      type="button"
                      disabled={updatingId === alert.id}
                      onClick={() => handleStatusChange(alert.id, AlertStatus.DISMISSED)}
                      className="px-2 py-0.5 rounded border font-semibold flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                      style={{
                        backgroundColor: "white",
                        borderColor: "var(--paper-mid)",
                        color: "var(--ink-faint)",
                      }}
                    >
                      <XCircle className="w-3 h-3" />
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
