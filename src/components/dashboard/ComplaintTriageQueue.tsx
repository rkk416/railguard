"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PaginatedComplaintsResult } from "@/services/complaintQueryService";
import {
  ComplaintStatus,
  ComplaintCategory,
  ComplaintSeverity,
} from "@prisma/client";
import {
  Search,
  Filter,
  ArrowUpDown,
  FileImage,
  History,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Train,
  MapPin,
  AlertTriangle,
} from "lucide-react";

interface ComplaintTriageQueueProps {
  initialData: PaginatedComplaintsResult;
}

export function ComplaintTriageQueue({ initialData }: ComplaintTriageQueueProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialData.filterSummary.search || "");
  const currentStatus = searchParams.get("status") || "ALL";
  const currentCategory = searchParams.get("category") || "ALL";
  const currentSeverity = searchParams.get("severity") || "ALL";
  const currentSort = searchParams.get("sort") || "desc";

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(newParams)) {
      if (val === null || val === "ALL" || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    if (!newParams.page) {
      params.set("page", "1");
    }

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}#triage`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: search.trim() });
  };

  const getStatusBadgeStyle = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.SUBMITTED:
        return { bg: "#eef2f1", text: "#3d524e", border: "#c2d1cd" };
      case ComplaintStatus.UNDER_REVIEW:
        return { bg: "#fdf8ee", text: "#7a5c1a", border: "#ebd7a9" };
      case ComplaintStatus.INVESTIGATION:
        return { bg: "#f2f7f5", text: "#2d6a5e", border: "#b8ddd6" };
      case ComplaintStatus.ACTION_REQUIRED:
        return { bg: "#fbf2ef", text: "#963d28", border: "#ecc8be" };
      case ComplaintStatus.NEEDS_INFORMATION:
        return { bg: "#f4f0f8", text: "#523a6b", border: "#d7cae5" };
      case ComplaintStatus.RESOLVED:
        return { bg: "#eef8f2", text: "#1b6334", border: "#b4e3c5" };
      case ComplaintStatus.REJECTED:
        return { bg: "#faf0f0", text: "#7a2828", border: "#e8c0c0" };
      case ComplaintStatus.DUPLICATE:
        return { bg: "#f0ede4", text: "#5c6663", border: "#d5d0c3" };
      default:
        return { bg: "#f0ede4", text: "#252d2b", border: "#d5d0c3" };
    }
  };

  const getSeverityBadgeStyle = (sev: ComplaintSeverity) => {
    switch (sev) {
      case ComplaintSeverity.CRITICAL:
        return { bg: "#fbf2ef", text: "#c65f48", border: "#ecc8be" };
      case ComplaintSeverity.HIGH:
        return { bg: "#fef5ec", text: "#b26a28", border: "#f0d5b8" };
      case ComplaintSeverity.MEDIUM:
        return { bg: "#fdf8ee", text: "#b28d55", border: "#ebd7a9" };
      case ComplaintSeverity.LOW:
        return { bg: "#f0ede4", text: "#8a9490", border: "#e4e0d4" };
    }
  };

  const statusTabs = [
    { label: "All Cases", value: "ALL" },
    { label: "Submitted", value: ComplaintStatus.SUBMITTED },
    { label: "Under Review", value: ComplaintStatus.UNDER_REVIEW },
    { label: "Investigation", value: ComplaintStatus.INVESTIGATION },
    { label: "Action Required", value: ComplaintStatus.ACTION_REQUIRED },
    { label: "Needs Info", value: ComplaintStatus.NEEDS_INFORMATION },
    { label: "Resolved", value: ComplaintStatus.RESOLVED },
    { label: "Rejected", value: ComplaintStatus.REJECTED },
    { label: "Duplicate", value: ComplaintStatus.DUPLICATE },
  ];

  return (
    <div
      id="triage"
      className="rounded-lg border overflow-hidden shadow-xs"
      style={{
        backgroundColor: "white",
        borderColor: "var(--paper-mid)",
      }}
    >
      {/* 1. Header & Search Bar */}
      <div
        className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3"
        style={{
          backgroundColor: "var(--archive-paper)",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div>
          <h2
            className="text-base font-bold font-serif flex items-center gap-2"
            style={{ color: "var(--rail-ink)" }}
          >
            <span>Operational Triage Register</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-mono border"
              style={{
                backgroundColor: "white",
                borderColor: "var(--paper-mid)",
                color: "var(--ink-muted)",
              }}
            >
              {initialData.pagination.total} records
            </span>
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
            Sequential log of passenger catering allegations and supervisory actions.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, train, station..."
              className="w-full rounded pl-8 pr-3 py-1.5 text-xs font-mono border focus:outline-none"
              style={{
                backgroundColor: "white",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0"
            style={{
              backgroundColor: "var(--rail-ink)",
              color: "var(--archive-paper)",
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* 2. Status Filter Tabs */}
      <div
        className="px-4 py-2 border-b overflow-x-auto flex items-center gap-1.5 no-scrollbar"
        style={{
          backgroundColor: "#faf8f4",
          borderColor: "var(--paper-mid)",
        }}
      >
        {statusTabs.map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateFilters({ status: tab.value })}
              className={`px-3 py-1 text-xs font-semibold rounded whitespace-nowrap transition-colors cursor-pointer ${
                isActive ? "shadow-xs" : ""
              }`}
              style={{
                backgroundColor: isActive ? "var(--rail-ink)" : "transparent",
                color: isActive ? "var(--archive-paper)" : "var(--ink-muted)",
                border: isActive ? "1px solid var(--rail-ink)" : "1px solid transparent",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Secondary Operational Filters */}
      <div
        className="p-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          backgroundColor: "var(--archive-paper)",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="font-mono uppercase text-[10px] font-semibold flex items-center gap-1"
            style={{ color: "var(--ink-faint)" }}
          >
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Category Filter */}
          <select
            value={currentCategory}
            onChange={(e) => updateFilters({ category: e.target.value })}
            className="rounded px-2.5 py-1 text-xs border focus:outline-none"
            style={{
              backgroundColor: "white",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          >
            <option value="ALL">All Categories</option>
            {Object.keys(ComplaintCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace("_", " ")}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={currentSeverity}
            onChange={(e) => updateFilters({ severity: e.target.value })}
            className="rounded px-2.5 py-1 text-xs border focus:outline-none"
            style={{
              backgroundColor: "white",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          >
            <option value="ALL">All Severities</option>
            {Object.keys(ComplaintSeverity).map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>

          {/* Active Filter Clear Button */}
          {(currentCategory !== "ALL" || currentSeverity !== "ALL" || currentStatus !== "ALL" || search) && (
            <button
              type="button"
              onClick={() => updateFilters({ category: "ALL", severity: "ALL", status: "ALL", search: "" })}
              className="text-[11px] underline font-mono cursor-pointer"
              style={{ color: "var(--signal-red)" }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Sort Direction Toggle */}
        <button
          type="button"
          onClick={() => updateFilters({ sort: currentSort === "asc" ? "desc" : "asc" })}
          className="flex items-center gap-1 font-mono text-[11px] px-2 py-1 rounded border transition-colors cursor-pointer"
          style={{
            backgroundColor: "white",
            borderColor: "var(--paper-mid)",
            color: "var(--ink-muted)",
          }}
        >
          <ArrowUpDown className="w-3 h-3" />
          <span>Date: {currentSort === "asc" ? "Oldest First" : "Newest First"}</span>
        </button>
      </div>

      {/* 4. Table Representation */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              className="border-b font-mono uppercase text-[10px] tracking-wider"
              style={{
                backgroundColor: "#f4f1ea",
                borderColor: "var(--paper-mid)",
                color: "var(--ink-muted)",
              }}
            >
              <th className="py-2.5 px-3">Reference / Category</th>
              <th className="py-2.5 px-3">Status / Hazard</th>
              <th className="py-2.5 px-3">Journey / Train</th>
              <th className="py-2.5 px-3">Allegation Summary</th>
              <th className="py-2.5 px-3 text-center">Evidence / Log</th>
              <th className="py-2.5 px-3 text-right">Logged At</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y font-sans" style={{ borderColor: "var(--paper-mid)" }}>
            {initialData.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center" style={{ color: "var(--ink-muted)" }}>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="w-6 h-6" style={{ color: "var(--brass)" }} />
                    <p className="font-semibold" style={{ color: "var(--rail-ink)" }}>
                      No matching records in operational triage register.
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                      Try adjusting the filter criteria or search query.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              initialData.items.map((c) => {
                const statusStyle = getStatusBadgeStyle(c.status);
                const sevStyle = getSeverityBadgeStyle(c.severity);
                return (
                  <tr
                    key={c.id}
                    className="register-row transition-colors group"
                  >
                    {/* Reference & Category */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold">
                        <Link
                          href={`/dashboard/complaints/${c.id}`}
                          className="hover:underline"
                          style={{ color: "var(--jade)" }}
                        >
                          {c.complaintRef}
                        </Link>
                      </div>
                      <div className="text-[11px] font-medium mt-0.5" style={{ color: "var(--ink-muted)" }}>
                        {c.category.replace("_", " ")}
                      </div>
                    </td>

                    {/* Status & Severity */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            borderColor: statusStyle.border,
                          }}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border"
                          style={{
                            backgroundColor: sevStyle.bg,
                            color: sevStyle.text,
                            borderColor: sevStyle.border,
                          }}
                        >
                          {c.severity}
                        </span>
                      </div>
                    </td>

                    {/* Journey & Train */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--rail-ink)" }}>
                        <Train className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ink-faint)" }} />
                        <span>{c.train?.trainNumber || c.unmatchedTrainNumber || "Unassigned"}</span>
                        {c.coach && (
                          <span
                            className="font-mono text-[10px] px-1 py-0.5 rounded border"
                            style={{
                              backgroundColor: "var(--archive-paper)",
                              borderColor: "var(--paper-mid)",
                              color: "var(--rail-ink)",
                            }}
                          >
                            {c.coach}
                          </span>
                        )}
                      </div>
                      {c.station && (
                        <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
                          <MapPin className="w-3 h-3 shrink-0" style={{ color: "var(--ink-faint)" }} />
                          <span>{c.station.code} ({c.station.name})</span>
                        </div>
                      )}
                    </td>

                    {/* Allegation Summary */}
                    <td className="py-3 px-3 max-w-xs md:max-w-md">
                      <p className="line-clamp-2 leading-relaxed" style={{ color: "var(--rail-ink)" }}>
                        {c.description}
                      </p>
                      {c.packagingUnit && (
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-faint)" }}>
                          Batch: {c.packagingUnit.batchNumber} • {c.packagingUnit.product.vendor.name}
                        </p>
                      )}
                    </td>

                    {/* Evidence & Logs Count */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {c.evidenceCount > 0 && (
                          <span
                            className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-mono border"
                            style={{
                              backgroundColor: "#f2f7f5",
                              borderColor: "#c2d9d2",
                              color: "var(--jade)",
                            }}
                            title={`${c.evidenceCount} evidence photos attached`}
                          >
                            <FileImage className="w-3 h-3" />
                            {c.evidenceCount}
                          </span>
                        )}
                        <span
                          className="flex items-center gap-1 text-[11px] font-mono"
                          style={{ color: "var(--ink-faint)" }}
                          title={`${c.eventCount} audit timeline events`}
                        >
                          <History className="w-3 h-3" />
                          {c.eventCount}
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-3 text-right font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
                      <div>{new Date(c.createdAt).toLocaleDateString()}</div>
                      <div style={{ color: "var(--ink-faint)" }}>
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    {/* Action link */}
                    <td className="py-3 px-3 text-center">
                      <Link
                        href={`/dashboard/complaints/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors"
                        style={{
                          backgroundColor: "var(--archive-paper)",
                          border: "1px solid var(--paper-mid)",
                          color: "var(--rail-ink)",
                        }}
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Pagination Controls */}
      <div
        className="p-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        style={{
          backgroundColor: "var(--archive-paper)",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
          Showing page <strong>{initialData.pagination.page}</strong> of{" "}
          <strong>{initialData.pagination.totalPages}</strong> (
          {initialData.pagination.total} records total)
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={initialData.pagination.page <= 1 || isPending}
            onClick={() => updateFilters({ page: (initialData.pagination.page - 1).toString() })}
            className="px-2.5 py-1 rounded border font-medium flex items-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{
              backgroundColor: "white",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="font-mono px-2 font-bold" style={{ color: "var(--rail-ink)" }}>
            {initialData.pagination.page}
          </span>

          <button
            type="button"
            disabled={
              initialData.pagination.page >= initialData.pagination.totalPages || isPending
            }
            onClick={() => updateFilters({ page: (initialData.pagination.page + 1).toString() })}
            className="px-2.5 py-1 rounded border font-medium flex items-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{
              backgroundColor: "white",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
