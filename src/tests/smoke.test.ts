import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Milestone 0 Foundation Smoke Test", () => {
  it("verifies vitest test runner executes properly", () => {
    expect(1 + 1).toBe(2);
  });

  it("verifies path aliases and utility functions work as expected", () => {
    const result = cn("bg-red-500", true && "text-white", false && "hidden");
    expect(result).toBe("bg-red-500 text-white");
  });
});
