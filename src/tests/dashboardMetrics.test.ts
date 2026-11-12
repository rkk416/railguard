import { describe, it, expect } from "vitest";
import { CorrectiveActionStatus } from "@prisma/client";

describe("Vendor Compliance Rate Calculation Rules", () => {
  function computeCompliance(
    actions: { status: CorrectiveActionStatus; deadline: Date | null }[],
    now: Date = new Date()
  ) {
    let satisfactory = 0;
    let nonCompliant = 0;
    let escalated = 0;
    let overdueUncompleted = 0;

    for (const act of actions) {
      if (act.status === CorrectiveActionStatus.VERIFIED_COMPLETE) {
        satisfactory += 1;
      } else if (act.status === CorrectiveActionStatus.NON_COMPLIANT) {
        nonCompliant += 1;
      } else if (act.status === CorrectiveActionStatus.ESCALATED) {
        escalated += 1;
      } else if (
        (act.status === CorrectiveActionStatus.PENDING || act.status === CorrectiveActionStatus.IN_PROGRESS) &&
        act.deadline &&
        act.deadline < now
      ) {
        overdueUncompleted += 1;
      }
    }

    const denominator = satisfactory + nonCompliant + escalated + overdueUncompleted;
    const rate = denominator > 0 ? Math.round((satisfactory / denominator) * 100) : null;

    return { rate, denominator, satisfactory, nonCompliant, escalated, overdueUncompleted };
  }

  it("calculates compliance percentage when valid actions exist", () => {
    const past = new Date(Date.now() - 24 * 3600 * 1000);
    const future = new Date(Date.now() + 24 * 3600 * 1000);

    const actions = [
      { status: CorrectiveActionStatus.VERIFIED_COMPLETE, deadline: past },
      { status: CorrectiveActionStatus.NON_COMPLIANT, deadline: past },
      { status: CorrectiveActionStatus.ESCALATED, deadline: future },
      { status: CorrectiveActionStatus.PENDING, deadline: past }, // Overdue uncompleted
      { status: CorrectiveActionStatus.PENDING, deadline: future }, // In grace period -> excluded from D
    ];

    const result = computeCompliance(actions);
    // Denominator = 1 (VERIFIED) + 1 (NON_COMPLIANT) + 1 (ESCALATED) + 1 (OVERDUE) = 4
    // Compliance = (1 / 4) * 100 = 25%
    expect(result.denominator).toBe(4);
    expect(result.satisfactory).toBe(1);
    expect(result.overdueUncompleted).toBe(1);
    expect(result.rate).toBe(25);
  });

  it("returns null when denominator is zero (No actions due)", () => {
    const future = new Date(Date.now() + 24 * 3600 * 1000);
    const actions = [
      { status: CorrectiveActionStatus.PENDING, deadline: future }, // In grace period
      { status: CorrectiveActionStatus.IN_PROGRESS, deadline: future }, // In grace period
    ];

    const result = computeCompliance(actions);
    expect(result.denominator).toBe(0);
    expect(result.rate).toBeNull();
  });
});
