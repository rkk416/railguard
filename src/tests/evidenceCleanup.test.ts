import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  queueEvidenceForCleanup,
  executePostCommitCleanup,
  getCleanupQueueStatus,
} from "@/services/evidenceCleanupService";
import fs from "fs";
import path from "path";

describe("Evidence Cleanup Outbox Service", () => {
  const testDir = path.resolve(process.cwd(), "evidence_storage", "test_cleanup");
  const testFile1 = path.join(testDir, "temp_photo_01.txt");
  const testFile2 = path.join(testDir, "temp_photo_02.txt");

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile1, "temporary test evidence content 1");
    fs.writeFileSync(testFile2, "temporary test evidence content 2");
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("safely queues and unlinks filesystem files after commit", async () => {
    expect(fs.existsSync(testFile1)).toBe(true);
    expect(fs.existsSync(testFile2)).toBe(true);

    const taskIds = queueEvidenceForCleanup([testFile1, testFile2]);
    expect(taskIds).toHaveLength(2);

    const result = await executePostCommitCleanup();
    expect(result.succeeded).toBeGreaterThanOrEqual(2);

    expect(fs.existsSync(testFile1)).toBe(false);
    expect(fs.existsSync(testFile2)).toBe(false);
  });

  it("handles non-existent or already removed files without throwing fatal errors", async () => {
    const nonExistentPath = path.join(testDir, "already_deleted.txt");
    queueEvidenceForCleanup([nonExistentPath]);

    const result = await executePostCommitCleanup();
    expect(result.failed).toBe(0); // If not existing, handled cleanly
  });

  it("tracks task status in the cleanup queue", () => {
    const queue = getCleanupQueueStatus();
    expect(Array.isArray(queue)).toBe(true);
  });
});
