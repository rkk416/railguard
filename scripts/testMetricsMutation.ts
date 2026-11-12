import { prisma } from "../src/lib/db/prisma";
import { getControlRoomMetrics } from "../src/services/dashboardMetricsService";
import { transitionComplaintStatus } from "../src/services/complaintMutationService";
import { executeDemoReset } from "../src/services/demoResetService";
import { UserRole, ComplaintStatus } from "@prisma/client";

async function testMetricsDynamicUpdates() {
  console.log("=== Testing Dynamic Metrics Updates on Database Mutation ===");

  const admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  if (!admin) throw new Error("Admin not found");

  // 1. Initial metrics
  const initialMetrics = await getControlRoomMetrics();
  console.log(`Initial Active Cases: ${initialMetrics.totalActiveCases}`);
  console.log(`Initial Resolved Cases: ${initialMetrics.totalResolved}`);

  // 2. Find a SUBMITTED complaint to transition to UNDER_REVIEW
  const submittedCase = await prisma.complaint.findFirst({
    where: { status: ComplaintStatus.SUBMITTED, deletedAt: null },
  });
  if (!submittedCase) throw new Error("No submitted case found");

  console.log(`Transitioning ${submittedCase.complaintRef} from SUBMITTED to UNDER_REVIEW...`);
  await transitionComplaintStatus({
    complaintId: submittedCase.id,
    targetStatus: ComplaintStatus.UNDER_REVIEW,
    actorId: admin.id,
    actorRole: UserRole.ADMIN,
    explanation: "Testing metrics responsiveness on mutation",
  });

  // Verify transition in events
  const latestEvent = await prisma.complaintEvent.findFirst({
    where: { complaintId: submittedCase.id },
    orderBy: { createdAt: "desc" },
  });
  console.log(`Audit Event Logged: ${latestEvent?.previousStatus} -> ${latestEvent?.newStatus}`);

  // 3. Find an ACTION_REQUIRED case and resolve it to verify RESOLVED metric increments
  const actionCase = await prisma.complaint.findFirst({
    where: { status: ComplaintStatus.ACTION_REQUIRED, deletedAt: null },
  });
  if (!actionCase) throw new Error("No ACTION_REQUIRED case found");

  console.log(`Resolving ${actionCase.complaintRef}...`);
  await transitionComplaintStatus({
    complaintId: actionCase.id,
    targetStatus: ComplaintStatus.RESOLVED,
    actorId: admin.id,
    actorRole: UserRole.ADMIN,
    explanation: "Corrective remedy verified. Closing case to test metrics increment.",
  });

  // 4. Verify metrics changed
  const updatedMetrics = await getControlRoomMetrics();
  console.log(`Updated Active Cases: ${updatedMetrics.totalActiveCases} (was ${initialMetrics.totalActiveCases})`);
  console.log(`Updated Resolved Cases: ${updatedMetrics.totalResolved} (was ${initialMetrics.totalResolved})`);

  if (updatedMetrics.totalResolved !== initialMetrics.totalResolved + 1) {
    throw new Error(
      `Resolved count did not increment! Expected ${initialMetrics.totalResolved + 1}, got ${updatedMetrics.totalResolved}`
    );
  }
  if (updatedMetrics.totalActiveCases !== initialMetrics.totalActiveCases - 1) {
    throw new Error(
      `Active cases count did not decrement! Expected ${initialMetrics.totalActiveCases - 1}, got ${updatedMetrics.totalActiveCases}`
    );
  }

  console.log("Verified: Metrics updated dynamically from actual PostgreSQL queries!");

  // 5. Clean up: reset back to pristine 35 baseline
  console.log("Re-running demo reset to restore pristine baseline...");
  await executeDemoReset({
    confirm: "RESET_DEMO_DATABASE",
    actorId: admin.id,
    actorRole: UserRole.ADMIN,
  });

  const finalMetrics = await getControlRoomMetrics();
  console.log(`Restored Active Cases: ${finalMetrics.totalActiveCases} (expected ${initialMetrics.totalActiveCases})`);
  console.log(`Restored Resolved Cases: ${finalMetrics.totalResolved} (expected ${initialMetrics.totalResolved})`);

  console.log("=== Metrics Dynamic Mutation Test PASSED 100% ===");
}

testMetricsDynamicUpdates()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
