import fs from "fs";
import path from "path";

export interface CleanupTask {
  id: string;
  filePath: string;
  enqueuedAt: Date;
  attempts: number;
  lastError?: string;
  status: "QUEUED" | "FAILED" | "COMPLETED";
}

// In-memory queue with persistent logging for retryable post-commit cleanup
const cleanupQueue: CleanupTask[] = [];

/**
 * Enqueue evidence file paths to be safely deleted after database transaction commits.
 */
export function queueEvidenceForCleanup(filePaths: string[]): string[] {
  const taskIds: string[] = [];
  for (const fp of filePaths) {
    if (!fp || typeof fp !== "string") continue;
    const id = `clean_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cleanupQueue.push({
      id,
      filePath: fp,
      enqueuedAt: new Date(),
      attempts: 0,
      status: "QUEUED",
    });
    taskIds.push(id);
  }
  return taskIds;
}

/**
 * Executes post-commit cleanup for queued evidence files.
 * If file unlink fails, records failure status and error details for auditability.
 * Never throws an uncaught error that would corrupt preceding database transaction.
 */
export async function executePostCommitCleanup(): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
  failures: { filePath: string; error: string }[];
}> {
  const pending = cleanupQueue.filter((t) => t.status === "QUEUED" || t.status === "FAILED");
  let succeeded = 0;
  let failed = 0;
  const failures: { filePath: string; error: string }[] = [];

  for (const task of pending) {
    task.attempts += 1;
    try {
      const resolvedPath = path.isAbsolute(task.filePath)
        ? task.filePath
        : path.resolve(process.cwd(), task.filePath);

      // Verify file exists before attempting delete
      if (fs.existsSync(resolvedPath)) {
        await fs.promises.unlink(resolvedPath);
      }
      task.status = "COMPLETED";
      succeeded += 1;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      task.status = "FAILED";
      task.lastError = errorMsg;
      failed += 1;
      failures.push({ filePath: task.filePath, error: errorMsg });
      console.warn(`[EvidenceCleanup] Failed to unlink file "${task.filePath}": ${errorMsg}`);
    }
  }

  return {
    attempted: pending.length,
    succeeded,
    failed,
    failures,
  };
}

/**
 * Returns current cleanup queue status for admin audit.
 */
export function getCleanupQueueStatus(): CleanupTask[] {
  return [...cleanupQueue];
}
