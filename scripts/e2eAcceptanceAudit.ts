import { prisma } from "../src/lib/db/prisma";
import { submitPassengerComplaint } from "../src/services/complaintSubmissionService";
import { getPublicComplaintTracking } from "../src/services/complaintTrackingService";
import {
  transitionComplaintStatus,
  assignInvestigator,
  appendInvestigativeFindings,
} from "../src/services/complaintMutationService";
import { verifyEvidenceAccessToken } from "../src/lib/crypto/token";
import { ComplaintCategory, ComplaintSeverity, ComplaintStatus, UserRole } from "@prisma/client";
import { executeDemoReset } from "../src/services/demoResetService";
import fs from "fs";
import path from "path";

async function runAudit() {
  console.log("==================================================================");
  console.log("   RAILGUARD PHASE 5 ACCEPTANCE AUDIT — LIVE DATABASE SUITE      ");
  console.log("==================================================================");

  // 1. Initial State Check
  const initialCount = await prisma.complaint.count({ where: { deletedAt: null } });
  console.log(`[Baseline] Active complaints in database: ${initialCount}`);
  if (initialCount !== 35) {
    console.warn(`[Warning] Expected 35 baseline complaints, found ${initialCount}. Running reset...`);
    const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
    if (!adminUser) throw new Error("No admin user found");
    await executeDemoReset({
      confirm: "RESET_DEMO_DATABASE",
      actorId: adminUser.id,
      actorRole: adminUser.role,
    });
  }

  // ------------------------------------------------------------------
  // AUDIT STEP 2: COMPLAINT SUBMISSION
  // ------------------------------------------------------------------
  console.log("\n--- STEP 2: COMPLAINT SUBMISSION AUDIT ---");

  // 2A: Valid submission without images
  const sub1 = await submitPassengerComplaint({
    category: ComplaintCategory.SPOILAGE,
    severity: ComplaintSeverity.HIGH,
    description: "Dal was sour and smelling fermented in dinner meal tray.",
    trainNumber: "12951",
    stationCode: "NDLS",
    coach: "B3-12",
  });
  console.log(`✓ 2A: Submitted without images -> Ref: ${sub1.complaintRef}, Token length: ${sub1.trackingToken.length}`);

  // Verify in database:
  const dbRecord1 = await prisma.complaint.findUnique({
    where: { complaintRef: sub1.complaintRef },
    include: { events: true, evidence: true },
  });
  if (!dbRecord1) throw new Error("Complaint not found in database");
  if (dbRecord1.status !== ComplaintStatus.SUBMITTED) throw new Error("Status is not SUBMITTED");
  if (dbRecord1.events.length !== 1 || !dbRecord1.events[0].isPublic) throw new Error("Initial public event missing");
  console.log(`  -> Verified in DB: Status=${dbRecord1.status}, Events=${dbRecord1.events.length}, Evidence=${dbRecord1.evidence.length}`);

  // 2B: Valid submission with images
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const sub2 = await submitPassengerComplaint({
    category: ComplaintCategory.FOREIGN_OBJECT,
    severity: ComplaintSeverity.CRITICAL,
    description: "Found broken plastic shard in curd container served on breakfast tray.",
    trainNumber: "12951",
    contactEmail: "passenger.secret@example.com",
    contactPhone: "+91-9876543210",
    evidenceFiles: [
      { fileName: "plastic_shard.jpg", declaredMimeType: "image/jpeg", buffer: jpegHeader },
    ],
  });
  console.log(`✓ 2B: Submitted with 1 image -> Ref: ${sub2.complaintRef}, Evidence count: ${sub2.evidenceCount}`);
  const dbRecord2 = await prisma.complaint.findUnique({
    where: { complaintRef: sub2.complaintRef },
    include: { evidence: true },
  });
  if (!dbRecord2 || dbRecord2.evidence.length !== 1) throw new Error("Evidence record not created");
  const evidenceFileOnDisk = path.resolve(process.cwd(), "evidence_storage", dbRecord2.evidence[0].storagePath);
  if (!fs.existsSync(evidenceFileOnDisk)) throw new Error("Evidence file missing on disk");
  console.log(`  -> Evidence file verified on disk: ${dbRecord2.evidence[0].storagePath}`);

  // ------------------------------------------------------------------
  // AUDIT STEP 3: PUBLIC TRACKING & DATA SANITIZATION
  // ------------------------------------------------------------------
  console.log("\n--- STEP 3: PUBLIC TRACKING & SANITIZATION AUDIT ---");

  // 3A: Valid lookup
  const track1 = await getPublicComplaintTracking(sub2.complaintRef, sub2.trackingToken);
  if (!track1.success || !track1.complaint) throw new Error("Tracking lookup failed with valid token");
  console.log(`✓ 3A: Valid tracking lookup succeeded: ${track1.complaint.complaintRef} [${track1.complaint.status}]`);

  // Verify Sanitization:
  const rawData = track1.complaint as unknown as Record<string, unknown>;
  if (rawData.contactEmail !== undefined || rawData.contactPhone !== undefined) {
    throw new Error("SECURITY FAILURE: Contact information leaked in public tracking response!");
  }
  if (rawData.storagePath !== undefined) {
    throw new Error("SECURITY FAILURE: Storage path leaked in public tracking response!");
  }
  const evidenceAsset = track1.complaint.evidenceAssets[0];
  if (!evidenceAsset.streamUrl.includes("evidenceToken=")) {
    throw new Error("SECURITY FAILURE: Stream URL does not use short-lived evidenceToken!");
  }
  if (evidenceAsset.streamUrl.includes(sub2.trackingToken)) {
    throw new Error("SECURITY FAILURE: Raw permanent tracking token exposed in streamUrl!");
  }
  console.log(`✓ 3B: Sanitization verified:`);
  console.log(`  -> contactEmail/phone: ${rawData.contactEmail ?? "STRICTLY EXCLUDED"}`);
  console.log(`  -> storagePath: ${rawData.storagePath ?? "STRICTLY EXCLUDED"}`);
  console.log(`  -> streamUrl format: ${evidenceAsset.streamUrl}`);

  // Verify short-lived evidence token:
  const tokenMatch = evidenceAsset.streamUrl.match(/evidenceToken=([^&]+)/);
  if (!tokenMatch) throw new Error("Failed to extract evidenceToken");
  const extractedToken = decodeURIComponent(tokenMatch[1]);
  const isEvTokenValid = verifyEvidenceAccessToken(extractedToken, evidenceAsset.id, dbRecord2.id);
  if (!isEvTokenValid) throw new Error("Evidence token failed verification!");
  console.log(`✓ 3C: Short-lived evidence token verified cryptographically.`);

  // 3D: Uniform error on wrong token vs non-existent ref
  const wrongTokenTrack = await getPublicComplaintTracking(sub2.complaintRef, "WRONGTOKENWRONGTOKENWRONGTOKEN12");
  const notFoundTrack = await getPublicComplaintTracking("RG-2026-9999", "WRONGTOKENWRONGTOKENWRONGTOKEN12");
  if (wrongTokenTrack.error !== notFoundTrack.error) {
    throw new Error("SECURITY FAILURE: Error message differs between invalid token and not-found ref (user enumeration)!");
  }
  console.log(`✓ 3D: Anti-enumeration defense verified: Uniform error "${wrongTokenTrack.error}"`);

  // ------------------------------------------------------------------
  // AUDIT STEP 4: REVIEWER INTEGRATION WORKFLOW
  // ------------------------------------------------------------------
  console.log("\n--- STEP 4: REVIEWER CONTROL ROOM INTEGRATION ---");
  const reviewer = await prisma.user.findFirst({ where: { role: UserRole.QUALITY_REVIEWER } });
  if (!reviewer) throw new Error("No reviewer found");

  // Reviewer transitions complaint: SUBMITTED -> UNDER_REVIEW
  await transitionComplaintStatus({
    complaintId: dbRecord2.id,
    targetStatus: ComplaintStatus.UNDER_REVIEW,
    actorId: reviewer.id,
    actorRole: reviewer.role,
    explanation: "Operations reviewer triaging foreign object allegation.",
  });
  console.log(`✓ 4A: Status transitioned to UNDER_REVIEW by reviewer.`);

  // Reviewer transitions: UNDER_REVIEW -> INVESTIGATION
  await transitionComplaintStatus({
    complaintId: dbRecord2.id,
    targetStatus: ComplaintStatus.INVESTIGATION,
    actorId: reviewer.id,
    actorRole: reviewer.role,
    explanation: "Formal investigation initiated with base kitchen quality supervisor.",
  });
  console.log(`✓ 4B: Status transitioned to INVESTIGATION by reviewer.`);

  // Reviewer assigns investigator
  await assignInvestigator({
    complaintId: dbRecord2.id,
    investigatorId: reviewer.id,
    actorId: reviewer.id,
    actorRole: reviewer.role,
    notes: "Assigning senior quality auditor to investigate meal tray defect.",
  });
  console.log(`✓ 4C: Investigator assigned to complaint.`);

  // Reviewer records finding
  await appendInvestigativeFindings({
    complaintId: dbRecord2.id,
    findings: "Visual inspection confirms packaging plastic defect during automated sealing.",
    determination: "VENDOR_FAULT",
    isCompleted: false,
    actorId: reviewer.id,
    actorRole: reviewer.role,
  });
  console.log(`✓ 4D: Investigation findings documented.`);

  // Public Passenger Tracking check after reviewer actions:
  const trackUpdated = await getPublicComplaintTracking(sub2.complaintRef, sub2.trackingToken);
  if (!trackUpdated.success || !trackUpdated.complaint) throw new Error("Updated tracking lookup failed");
  if (trackUpdated.complaint.status !== ComplaintStatus.INVESTIGATION) {
    throw new Error(`Expected public status INVESTIGATION, got ${trackUpdated.complaint.status}`);
  }
  console.log(`✓ 4D: Public timeline updated seamlessly:`);
  trackUpdated.complaint.publicEvents.forEach((evt, idx) => {
    console.log(`  -> Event ${idx + 1}: [${evt.newStatus}] ${evt.explanation}`);
  });

  // ------------------------------------------------------------------
  // CLEANUP & RESET
  // ------------------------------------------------------------------
  console.log("\n--- RESTORING BASELINE VIA SECURE DEMO RESET ---");
  const adminUser = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  if (!adminUser) throw new Error("No admin found for reset");
  const resetRes = await executeDemoReset({
    confirm: "RESET_DEMO_DATABASE",
    actorId: adminUser.id,
    actorRole: adminUser.role,
  });
  console.log(`✓ Database reset successfully completed: ${resetRes.restoredCounts.complaints} complaints restored.`);

  console.log("\n==================================================================");
  console.log("   ALL PHASE 5 ACCEPTANCE AUDIT CHECKS PASSED WITH 100% SUCCESS  ");
  console.log("==================================================================");
}

runAudit()
  .catch((err) => {
    console.error("AUDIT FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
