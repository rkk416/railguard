import { prisma } from "../src/lib/db/prisma";
import { submitPassengerComplaint } from "../src/services/complaintSubmissionService";
import { hashTrackingToken, verifyTrackingToken } from "../src/lib/crypto/token";
import { executeDemoReset } from "../src/services/demoResetService";
import { ComplaintCategory, ComplaintSeverity, UserRole } from "@prisma/client";

async function testPhase5ASubmission() {
  console.log("=== Testing Phase 5A: Passenger Complaint Submission Flow ===");

  // Create valid JPEG binary buffer
  const sampleJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);

  const submission = await submitPassengerComplaint({
    packagingQrCode: "DEMO-THALI-ACTIVE-001",
    category: ComplaintCategory.SPOILAGE,
    severity: ComplaintSeverity.HIGH,
    description: "End-to-end integration test: sour dal and contaminated curd tray.",
    trainNumber: "12951",
    stationCode: "NDLS",
    coach: "B4-18",
    contactEmail: "passenger.test@example.com",
    contactPhone: "+91-9988776655",
    evidenceFiles: [
      {
        fileName: "passenger_dal_sample.jpg",
        declaredMimeType: "image/jpeg",
        buffer: sampleJpeg,
      },
    ],
  });

  console.log(`Generated Reference: ${submission.complaintRef}`);
  console.log(`Generated Raw Token: ${submission.trackingToken}`);
  console.log(`Evidence Files Attached: ${submission.evidenceCount}`);

  // 1. Verify Raw Token Length
  if (submission.trackingToken.length !== 32) {
    throw new Error(`Invalid tracking token length: ${submission.trackingToken.length}`);
  }

  // 2. Fetch Complaint from PostgreSQL
  const dbComplaint = await prisma.complaint.findUnique({
    where: { complaintRef: submission.complaintRef },
    include: {
      evidence: true,
      events: true,
      train: true,
      station: true,
      packagingUnit: true,
    },
  });

  if (!dbComplaint) {
    throw new Error("Complaint was not found in PostgreSQL!");
  }

  console.log("Found complaint in PostgreSQL:", dbComplaint.id);

  // 3. Cryptographic Token Security Invariant
  // Verify DB contains only the SHA-256 hash
  const expectedHash = hashTrackingToken(submission.trackingToken);
  if (dbComplaint.trackingTokenHash !== expectedHash) {
    throw new Error("Stored trackingTokenHash does not match SHA-256 computation!");
  }
  if (!verifyTrackingToken(submission.trackingToken, dbComplaint.trackingTokenHash)) {
    throw new Error("verifyTrackingToken() failed on stored hash!");
  }
  console.log("Verified: Database stores strictly SHA-256 hash. Raw token verification succeeded.");

  // 4. Verify Evidence Linked
  if (dbComplaint.evidence.length !== 1) {
    throw new Error(`Expected 1 evidence row, got ${dbComplaint.evidence.length}`);
  }
  console.log(`Verified: Evidence row created (${dbComplaint.evidence[0].storagePath})`);

  // 5. Verify Initial Event
  if (dbComplaint.events.length !== 1 || dbComplaint.events[0].newStatus !== "SUBMITTED") {
    throw new Error("Initial SUBMITTED event was not recorded!");
  }
  console.log("Verified: Initial SUBMITTED ComplaintEvent recorded.");

  // 6. Clean up: Reset back to pristine 35 baseline
  console.log("Resetting database to restore pristine 35 baseline...");
  const admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  if (admin) {
    await executeDemoReset({
      confirm: "RESET_DEMO_DATABASE",
      actorId: admin.id,
      actorRole: UserRole.ADMIN,
    });
  }

  const finalCount = await prisma.complaint.count({ where: { deletedAt: null } });
  console.log(`Final Complaint Count in DB: ${finalCount} (expected 35)`);
  if (finalCount !== 35) {
    throw new Error(`Expected 35 complaints after reset, got ${finalCount}`);
  }

  console.log("=== Phase 5A Submission Test PASSED 100% ===");
}

testPhase5ASubmission()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
