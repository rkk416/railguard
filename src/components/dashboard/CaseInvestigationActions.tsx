"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ComplaintStatus,
  UserRole,
  InvestigationDetermination,
  CorrectiveActionType,
} from "@prisma/client";
import {
  CheckCircle,
  AlertTriangle,
  Send,
  UserCheck,
  FileEdit,
  ShieldAlert,
  Trash2,
} from "lucide-react";

interface CaseInvestigationActionsProps {
  complaintId: string;
  currentStatus: ComplaintStatus;
  currentUser: {
    id: string;
    role: UserRole;
    name: string;
  };
  investigation: {
    id: string;
    investigatorId: string | null;
    determination: InvestigationDetermination | null;
    isCompleted: boolean;
  } | null;
  availableReviewers: { id: string; name: string; email: string }[];
}

export function CaseInvestigationActions({
  complaintId,
  currentStatus,
  currentUser,
  investigation,
  availableReviewers,
}: CaseInvestigationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tab State
  const [activeAction, setActiveAction] = useState<
    "status" | "assign" | "findings" | "action" | "delete"
  >("status");

  // Form states
  const [targetStatus, setTargetStatus] = useState<ComplaintStatus>(
    currentStatus === ComplaintStatus.SUBMITTED
      ? ComplaintStatus.UNDER_REVIEW
      : currentStatus === ComplaintStatus.UNDER_REVIEW
      ? ComplaintStatus.INVESTIGATION
      : ComplaintStatus.RESOLVED
  );
  const [transitionExplanation, setTransitionExplanation] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [selectedInvestigator, setSelectedInvestigator] = useState(
    investigation?.investigatorId || availableReviewers[0]?.id || ""
  );
  const [assignNotes, setAssignNotes] = useState("");

  const [findingsText, setFindingsText] = useState("");
  const [determination, setDetermination] = useState<InvestigationDetermination>(
    InvestigationDetermination.VENDOR_FAULT
  );
  const [markCompleted, setMarkCompleted] = useState(false);

  const [actionType, setActionType] = useState<CorrectiveActionType>(
    CorrectiveActionType.WARNING_LETTER
  );
  const [actionDesc, setActionDesc] = useState("");
  const [responsibleParty, setResponsibleParty] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(7);

  const [deleteReason, setDeleteReason] = useState("");

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearFeedback = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. Submit Status Transition
  const handleTransitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    try {
      const res = await fetch(`/api/complaints/${complaintId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStatus,
          explanation: transitionExplanation,
          rejectionReason: targetStatus === ComplaintStatus.REJECTED ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transition failed");

      setSuccessMsg(`Status successfully transitioned to ${targetStatus}`);
      setTransitionExplanation("");
      setRejectionReason("");
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error executing transition");
    }
  };

  // 2. Submit Investigator Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    try {
      const res = await fetch(`/api/complaints/${complaintId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigatorId: selectedInvestigator,
          notes: assignNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assignment failed");

      setSuccessMsg("Investigator assigned successfully.");
      setAssignNotes("");
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error assigning investigator");
    }
  };

  // 3. Submit Findings
  const handleFindingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    try {
      const res = await fetch(`/api/complaints/${complaintId}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findings: findingsText,
          determination,
          isCompleted: markCompleted,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record findings");

      setSuccessMsg("Investigative findings recorded in audit trail.");
      setFindingsText("");
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error recording findings");
    }
  };

  // 4. Submit Corrective Action
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Number(deadlineDays));

    try {
      const res = await fetch(`/api/complaints/${complaintId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          description: actionDesc,
          responsibleParty,
          deadline: deadline.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create corrective action");

      setSuccessMsg("Corrective action issued and logged.");
      setActionDesc("");
      setResponsibleParty("");
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error creating corrective action");
    }
  };

  // 5. Submit Soft Deletion (Admin only)
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    try {
      const res = await fetch(`/api/complaints/${complaintId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletedReason: deleteReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Soft deletion failed");

      setSuccessMsg("Complaint soft-deleted successfully.");
      setDeleteReason("");
      startTransition(() => router.push("/dashboard#triage"));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error during deletion");
    }
  };

  return (
    <div
      className="rounded-lg border shadow-xs overflow-hidden"
      style={{
        backgroundColor: "white",
        borderColor: "var(--paper-mid)",
        color: "var(--rail-ink)",
      }}
    >
      {/* Header Tabs */}
      <div
        className="flex items-center overflow-x-auto border-b text-xs no-scrollbar"
        style={{
          backgroundColor: "var(--archive-paper)",
          borderColor: "var(--paper-mid)",
        }}
      >
        <button
          type="button"
          onClick={() => { setActiveAction("status"); clearFeedback(); }}
          className={`px-3 py-2.5 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeAction === "status" ? "border-b-2" : "opacity-70 hover:opacity-100"
          }`}
          style={{
            borderColor: activeAction === "status" ? "var(--jade)" : "transparent",
            color: activeAction === "status" ? "var(--jade)" : "var(--ink-muted)",
          }}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Transition</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveAction("assign"); clearFeedback(); }}
          className={`px-3 py-2.5 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeAction === "assign" ? "border-b-2" : "opacity-70 hover:opacity-100"
          }`}
          style={{
            borderColor: activeAction === "assign" ? "var(--brass)" : "transparent",
            color: activeAction === "assign" ? "var(--brass)" : "var(--ink-muted)",
          }}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Assign</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveAction("findings"); clearFeedback(); }}
          className={`px-3 py-2.5 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeAction === "findings" ? "border-b-2" : "opacity-70 hover:opacity-100"
          }`}
          style={{
            borderColor: activeAction === "findings" ? "var(--jade)" : "transparent",
            color: activeAction === "findings" ? "var(--jade)" : "var(--ink-muted)",
          }}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Record Findings</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveAction("action"); clearFeedback(); }}
          className={`px-3 py-2.5 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeAction === "action" ? "border-b-2" : "opacity-70 hover:opacity-100"
          }`}
          style={{
            borderColor: activeAction === "action" ? "var(--signal-red)" : "transparent",
            color: activeAction === "action" ? "var(--signal-red)" : "var(--ink-muted)",
          }}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Issue Remedy</span>
        </button>

        {currentUser.role === UserRole.ADMIN && (
          <button
            type="button"
            onClick={() => { setActiveAction("delete"); clearFeedback(); }}
            className={`px-3 py-2.5 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeAction === "delete" ? "border-b-2" : "opacity-70 hover:opacity-100"
            }`}
            style={{
              borderColor: activeAction === "delete" ? "var(--signal-red)" : "transparent",
              color: "var(--signal-red)",
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Soft Delete</span>
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Messages */}
        {errorMsg && (
          <div
            className="mb-4 text-xs p-3 rounded border flex items-center gap-2"
            style={{
              backgroundColor: "rgba(198, 95, 72, 0.08)",
              borderColor: "rgba(198, 95, 72, 0.3)",
              color: "var(--signal-red)",
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            className="mb-4 text-xs p-3 rounded border flex items-center gap-2"
            style={{
              backgroundColor: "#f2f7f5",
              borderColor: "#c2d9d2",
              color: "var(--jade)",
            }}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Status Transition */}
        {activeAction === "status" && (
          <form onSubmit={handleTransitionSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Target Status:
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as ComplaintStatus)}
                className="w-full rounded p-2 border focus:outline-none"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              >
                {Object.keys(ComplaintStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {targetStatus === ComplaintStatus.REJECTED && (
              <div>
                <label className="block font-semibold mb-1" style={{ color: "var(--signal-red)" }}>
                  Rejection Rationale (Mandatory):
                </label>
                <textarea
                  rows={2}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Specify factual basis for rejection (e.g. physical verification refuted allegation)..."
                  className="w-full rounded p-2 border focus:outline-none"
                  style={{
                    backgroundColor: "var(--archive-paper)",
                    borderColor: "rgba(198, 95, 72, 0.4)",
                    color: "var(--rail-ink)",
                  }}
                />
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Audit Timeline Explanation:
              </label>
              <textarea
                rows={2}
                required
                value={transitionExplanation}
                onChange={(e) => setTransitionExplanation(e.target.value)}
                placeholder="Enter formal justification for status update to be recorded in audit log..."
                className="w-full rounded p-2 border focus:outline-none"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !transitionExplanation.trim()}
              className="px-4 py-2 rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              style={{
                backgroundColor: "var(--rail-ink)",
                color: "var(--archive-paper)",
              }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply State Transition</span>
            </button>
          </form>
        )}

        {/* Tab 2: Assign Investigator */}
        {activeAction === "assign" && (
          <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Select Authorized Safety Inspector:
              </label>
              <select
                value={selectedInvestigator}
                onChange={(e) => setSelectedInvestigator(e.target.value)}
                className="w-full rounded p-2 border focus:outline-none"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              >
                {availableReviewers.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    {rev.name} ({rev.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Assignment Directives / Special Instructions:
              </label>
              <textarea
                rows={2}
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="Specific testing required (e.g. test oil rancidity, verify batch temp logs)..."
                className="w-full rounded p-2 border focus:outline-none"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !selectedInvestigator}
              className="px-4 py-2 rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              style={{
                backgroundColor: "var(--brass)",
                color: "white",
              }}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Inspector &amp; Dispatch Inquest</span>
            </button>
          </form>
        )}

        {/* Tab 3: Findings */}
        {activeAction === "findings" && (
          <form onSubmit={handleFindingsSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Formal Determination:
              </label>
              <select
                value={determination}
                onChange={(e) => setDetermination(e.target.value as InvestigationDetermination)}
                className="w-full rounded p-2 border focus:outline-none"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              >
                {Object.keys(InvestigationDetermination).map((det) => (
                  <option key={det} value={det}>
                    {det.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Investigation Findings / Lab Analysis:
              </label>
              <textarea
                rows={3}
                required
                value={findingsText}
                onChange={(e) => setFindingsText(e.target.value)}
                placeholder="Document factual observations, pantry inspection results, or sample tests..."
                className="w-full rounded p-2 border focus:outline-none leading-relaxed"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="markCompleted"
                checked={markCompleted}
                onChange={(e) => setMarkCompleted(e.target.checked)}
                className="rounded cursor-pointer"
              />
              <label htmlFor="markCompleted" className="cursor-pointer" style={{ color: "var(--rail-ink)" }}>
                Mark investigation inquiry formally complete
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending || !findingsText.trim()}
              className="px-4 py-2 rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              style={{
                backgroundColor: "var(--jade)",
                color: "white",
              }}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Record Findings to Audit Trail</span>
            </button>
          </form>
        )}

        {/* Tab 4: Issue Corrective Action */}
        {activeAction === "action" && (
          <form onSubmit={handleActionSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Remedy Action Type:
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as CorrectiveActionType)}
                className="w-full rounded p-2 border focus:outline-none"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              >
                {Object.keys(CorrectiveActionType).map((act) => (
                  <option key={act} value={act}>
                    {act.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Responsible Party (Vendor / Kitchen / Station Team):
              </label>
              <input
                type="text"
                required
                value={responsibleParty}
                onChange={(e) => setResponsibleParty(e.target.value)}
                placeholder="e.g. Northern Caterers Ltd (Base Kitchen NDLS)"
                className="w-full rounded p-2 border focus:outline-none font-mono"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Compliance Deadline (Days from Today):
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="w-full rounded p-2 border focus:outline-none font-mono"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Remedial Mandate Description:
              </label>
              <textarea
                rows={2}
                required
                value={actionDesc}
                onChange={(e) => setActionDesc(e.target.value)}
                placeholder="Specify precise remedy required (e.g. mandatory recall of batch, 10,000 INR penalty)..."
                className="w-full rounded p-2 border focus:outline-none"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !actionDesc.trim() || !responsibleParty.trim()}
              className="px-4 py-2 rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              style={{
                backgroundColor: "var(--signal-red)",
                color: "white",
              }}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Issue Corrective Mandate</span>
            </button>
          </form>
        )}

        {/* Tab 5: Soft Delete (Admin Only) */}
        {activeAction === "delete" && currentUser.role === UserRole.ADMIN && (
          <form onSubmit={handleDeleteSubmit} className="space-y-3 text-xs">
            <div
              className="p-3 rounded border text-xs"
              style={{
                backgroundColor: "rgba(198, 95, 72, 0.08)",
                borderColor: "rgba(198, 95, 72, 0.3)",
                color: "var(--signal-red)",
              }}
            >
              <strong className="block font-semibold mb-1">
                Administrative Soft Deletion
              </strong>
              Complaints under active investigation cannot be deleted. Deleted complaints are
              hidden from operational triage and tracking but retained in compliance archive.
            </div>

            <div>
              <label className="block font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                Reason for Soft Deletion (Mandatory):
              </label>
              <textarea
                rows={2}
                required
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Justify deletion for administrative compliance audit..."
                className="w-full rounded p-2 border focus:outline-none"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !deleteReason.trim()}
              className="px-4 py-2 rounded font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              style={{ backgroundColor: "var(--signal-red)" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Execute Soft Deletion</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
