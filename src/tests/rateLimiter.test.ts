import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/validation/rateLimiter";

describe("Sliding Window IP Rate Limiter", () => {
  it("permits requests within configured threshold", () => {
    const testIp = `192.168.1.${Math.floor(Math.random() * 200 + 10)}`;
    const res1 = checkRateLimit(testIp, 3, 5000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(testIp, 3, 5000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(testIp, 3, 5000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests once maximum limit is reached", () => {
    const testIp = `10.0.0.${Math.floor(Math.random() * 200 + 10)}`;
    // Exceed limit of 2
    checkRateLimit(testIp, 2, 5000);
    checkRateLimit(testIp, 2, 5000);

    const blocked = checkRateLimit(testIp, 2, 5000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInSeconds).toBeGreaterThan(0);
  });
});
