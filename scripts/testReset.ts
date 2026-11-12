import { prisma } from "../src/lib/db/prisma";
import { executeDemoReset } from "../src/services/demoResetService";
import { UserRole, ComplaintCategory, ComplaintStatus } from "@prisma/client";
import fs from "fs";
import path from "path";

async function runResetVerification() {
  console.log("=== Testing Demonstration Reset Procedure ===");

  // 1. Fetch Admin
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });
  if (!admin) throw new Error("Admin user not found");

  // 2. Insert a temporary mutation record to verify it gets wiped
  const dummyRef = "RG-MUTATION-TEST-999";
  await prisma.complaint.create({
    data: {
      complaintRef: dummyRef,
      trackingTokenHash: "DUMMY_MUTATION_HASH_1234567890",
      category: ComplaintCategory.OTHER,
      description: "Temporary mutation to verify wipe on reset.",
      status: ComplaintStatus.SUBMITTED,
    },
  });

  const countBefore = await prisma.complaint.count();
  console.log(`Count after adding mutation: ${countBefore} (expected 36)`);
  if (countBefore !== 36) {
    throw new Error(`Expected 36 complaints, found ${countBefore}`);
  }

  // Create temporary upload evidence file
  const testUploadDir = path.resolve(process.cwd(), "evidence_storage", "uploads");
  if (!fs.existsSync(testUploadDir)) fs.mkdirSync(testUploadDir, { recursive: true });
  const dummyUploadPath = path.join(testUploadDir, "mutation_dummy.svg");
  fs.writeFileSync(dummyUploadPath, "<svg>dummy mutation upload</svg>");
  console.log(`Created dummy upload: ${dummyUploadPath}`);

  // 3. Execute Demonstration Reset
  console.log("Executing executeDemoReset()...");
  const result = await executeDemoReset({
    confirm: "RESET_DEMO_DATABASE",
    actorId: admin.id,
    actorRole: UserRole.ADMIN,
    actorEmail: admin.email,
  });

  console.log("Reset result success:", result.success);
  console.log("Restored complaint count:", result.restoredCounts.complaints);

  // 4. Verify baseline restored
  const finalCount = await prisma.complaint.count();
  console.log(`Final complaint count in DB: ${finalCount} (expected 35)`);
  if (finalCount !== 35) {
    throw new Error(`Expected exactly 35 complaints after reset, found ${finalCount}`);
  }

  // 5. Verify dummy record is deleted
  const dummy = await prisma.complaint.findUnique({
    where: { complaintRef: dummyRef },
  });
  if (dummy) {
    throw new Error("Dummy mutation still exists in database!");
  }
  console.log("Verified dummy record was cleanly wiped.");

  // 6. Verify evidence file cleanup
  const fileExists = fs.existsSync(dummyUploadPath);
  console.log(`Dummy upload file exists: ${fileExists} (expected false)`);
  if (fileExists) {
    throw new Error("Dummy upload file was not cleaned up!");
  }

  console.log("=== Demo Reset Verification PASSED 100% ===");
}

runResetVerification()
  .catch((e) => {
    console.error("Reset verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
