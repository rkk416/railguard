import { describe, it, expect } from "vitest";
import { isTransitionPermitted } from "@/services/complaintMutationService";
import { ComplaintStatus } from "@prisma/client";

describe("RailGuard Complaint State Machine Constraints", () => {
  it("allows legal progression from SUBMITTED", () => {
    expect(isTransitionPermitted(ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW)).toBe(true);
    expect(isTransitionPermitted(ComplaintStatus.SUBMITTED, ComplaintStatus.DUPLICATE)).toBe(true);
    expect(isTransitionPermitted(ComplaintStatus.SUBMITTED, ComplaintStatus.REJECTED)).toBe(true);
  });

  it("prohibits skipping lifecycle stages directly to terminal states", () => {
    // Cannot jump straight from SUBMITTED to RESOLVED or ACTION_REQUIRED
    expect(isTransitionPermitted(ComplaintStatus.SUBMITTED, ComplaintStatus.RESOLVED)).toBe(false);
    expect(isTransitionPermitted(ComplaintStatus.SUBMITTED, ComplaintStatus.ACTION_REQUIRED)).toBe(false);
  });

  it("permits progression from UNDER_REVIEW to INVESTIGATION and NEEDS_INFORMATION", () => {
    expect(isTransitionPermitted(ComplaintStatus.UNDER_REVIEW, ComplaintStatus.INVESTIGATION)).toBe(true);
    expect(isTransitionPermitted(ComplaintStatus.UNDER_REVIEW, ComplaintStatus.NEEDS_INFORMATION)).toBe(true);
    expect(isTransitionPermitted(ComplaintStatus.UNDER_REVIEW, ComplaintStatus.REJECTED)).toBe(true);
  });

  it("permits progression from INVESTIGATION to ACTION_REQUIRED or RESOLVED", () => {
    expect(isTransitionPermitted(ComplaintStatus.INVESTIGATION, ComplaintStatus.ACTION_REQUIRED)).toBe(true);
    expect(isTransitionPermitted(ComplaintStatus.INVESTIGATION, ComplaintStatus.RESOLVED)).toBe(true);
    expect(isTransitionPermitted(ComplaintStatus.INVESTIGATION, ComplaintStatus.REJECTED)).toBe(true);
  });

  it("enforces DUPLICATE as an immutable terminal state", () => {
    expect(isTransitionPermitted(ComplaintStatus.DUPLICATE, ComplaintStatus.UNDER_REVIEW)).toBe(false);
    expect(isTransitionPermitted(ComplaintStatus.DUPLICATE, ComplaintStatus.INVESTIGATION)).toBe(false);
    expect(isTransitionPermitted(ComplaintStatus.DUPLICATE, ComplaintStatus.RESOLVED)).toBe(false);
  });

  it("permits controlled reopening from RESOLVED or REJECTED back to UNDER_REVIEW", () => {
    expect(isTransitionPermitted(ComplaintStatus.RESOLVED, ComplaintStatus.UNDER_REVIEW)).toBe(true);
    expect(isTransitionPermitted(ComplaintStatus.REJECTED, ComplaintStatus.UNDER_REVIEW)).toBe(true);
  });

  it("forbids illegal transitions from RESOLVED directly to INVESTIGATION without prior review", () => {
    expect(isTransitionPermitted(ComplaintStatus.RESOLVED, ComplaintStatus.INVESTIGATION)).toBe(false);
  });
});
