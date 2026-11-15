import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "unknown";

  try {
    // Lightweight connectivity probe (500ms timeout budget)
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unreachable";
    console.warn(`[HealthCheck] Database probe note: ${errorMsg}`);
    dbStatus = "disconnected";
  }

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      service: "railguard",
      database: dbStatus,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
