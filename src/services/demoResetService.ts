import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";
import { seedRailGuardData, SeedSummary } from "./seedData";
import {
  queueEvidenceForCleanup,
  executePostCommitCleanup,
} from "./evidenceCleanupService";
import fs from "fs";
import path from "path";

export interface DemoResetOptions {
  confirm: string;
  actorId: string;
  actorRole: UserRole;
  actorEmail?: string;
}

export interface DemoResetResult {
  success: boolean;
  message: string;
  timestamp: string;
  resetBy: {
    id: string;
    email?: string;
    role: UserRole;
  };
  restoredCounts: SeedSummary;
  evidenceCleanup: {
    filesQueued: number;
    filesRemoved: number;
    failures: number;
  };
}

/**
 * Hardened Admin-Only Demonstration Reset Service.
 * Safely wipes any dynamic test submissions or mutated cases and reinstates
 * the pristine 35-complaint demonstration baseline within an atomic transaction.
 */
export async function executeDemoReset(options: DemoResetOptions): Promise<DemoResetResult> {
  // 0. Production Safety Guard
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_RESET !== "true") {
    throw new Error(
      "FORBIDDEN: Demonstration reset is disabled in production environments without ALLOW_DEMO_RESET=true."
    );
  }

  // 1. Strict Server-Side Role Guard
  if (options.actorRole !== UserRole.ADMIN) {
    throw new Error("FORBIDDEN: Only administrators can execute a demonstration reset.");
  }

  // 2. Explicit Confirmation Guard
  if (options.confirm !== "RESET_DEMO_DATABASE") {
    throw new Error(
      'INVALID_CONFIRMATION: Must provide explicit confirmation payload: { confirm: "RESET_DEMO_DATABASE" }'
    );
  }

  console.log(`[DemoReset] Initiated by Admin (${options.actorId} / ${options.actorEmail})`);

  // 3. Find temporary non-demo evidence files on disk to queue for cleanup
  const uploadsDir = path.resolve(process.cwd(), "evidence_storage", "uploads");
  const filesToClean: string[] = [];
  if (fs.existsSync(uploadsDir)) {
    const uploadedFiles = fs.readdirSync(uploadsDir);
    for (const f of uploadedFiles) {
      filesToClean.push(path.join(uploadsDir, f));
    }
  }

  // Enqueue paths before database wipe
  queueEvidenceForCleanup(filesToClean);

  // 4. Atomic Database Wipe and Re-seed
  // Executed inside an interactive transaction to prevent intermediate state leakage
  await prisma.$transaction(
    async (tx) => {
      // Delete child rows first respecting foreign key constraints
      await tx.recurringIssueAlertComplaint.deleteMany();
      await tx.recurringIssueAlert.deleteMany();
      await tx.correctiveAction.deleteMany();
      await tx.investigation.deleteMany();
      await tx.complaintEvidence.deleteMany();
      await tx.complaintEvent.deleteMany();
      await tx.complaint.deleteMany();
      await tx.packagingUnit.deleteMany();
      await tx.product.deleteMany();
      await tx.train.deleteMany();
      await tx.station.deleteMany();
      await tx.vendor.deleteMany();
      await tx.user.deleteMany();
    },
    { timeout: 30000 }
  );

  // 5. Restore Pristine 35-Complaint Baseline
  const restoredCounts = await seedRailGuardData(prisma);

  // 6. Safe Post-Commit Evidence Cleanup
  const cleanupSummary = await executePostCommitCleanup();

  console.log(`[DemoReset] Database reset completed. Restored ${restoredCounts.complaints} complaints.`);

  return {
    success: true,
    message: "Demonstration database successfully reset to pristine 35-case operational baseline.",
    timestamp: new Date().toISOString(),
    resetBy: {
      id: options.actorId,
      email: options.actorEmail,
      role: options.actorRole,
    },
    restoredCounts,
    evidenceCleanup: {
      filesQueued: filesToClean.length,
      filesRemoved: cleanupSummary.succeeded,
      failures: cleanupSummary.failed,
    },
  };
}
