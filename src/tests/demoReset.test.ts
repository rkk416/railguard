import { describe, it, expect } from "vitest";
import { executeDemoReset } from "@/services/demoResetService";
import { UserRole } from "@prisma/client";

describe("Demo Reset Service Authorization & Validation", () => {
  it("rejects non-admin role execution with FORBIDDEN error", async () => {
    await expect(
      executeDemoReset({
        confirm: "RESET_DEMO_DATABASE",
        actorId: "reviewer-uuid",
        actorRole: UserRole.QUALITY_REVIEWER,
      })
    ).rejects.toThrow(/FORBIDDEN/i);
  });

  it("rejects execution without exact confirmation payload", async () => {
    await expect(
      executeDemoReset({
        confirm: "reset",
        actorId: "admin-uuid",
        actorRole: UserRole.ADMIN,
      })
    ).rejects.toThrow(/INVALID_CONFIRMATION/i);
  });
});
