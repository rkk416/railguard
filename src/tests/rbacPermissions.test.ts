import { describe, it, expect } from "vitest";
import { softDeleteComplaint } from "@/services/complaintMutationService";
import { UserRole } from "@prisma/client";

describe("Server-Side RBAC Enforcement", () => {
  it("strictly forbids QUALITY_REVIEWER from executing soft deletions", async () => {
    await expect(
      softDeleteComplaint({
        complaintId: "mock-complaint-id",
        deletedReason: "Attempted unauthorized soft deletion",
        actorId: "reviewer-uuid",
        actorRole: UserRole.QUALITY_REVIEWER,
      })
    ).rejects.toThrow(/FORBIDDEN: Only administrators have privilege/i);
  });

  it("requires administrative rationale when attempting soft deletion", async () => {
    await expect(
      softDeleteComplaint({
        complaintId: "mock-complaint-id",
        deletedReason: "   ",
        actorId: "admin-uuid",
        actorRole: UserRole.ADMIN,
      })
    ).rejects.toThrow(/VALIDATION_ERROR: An administrative deletion rationale/i);
  });
});
