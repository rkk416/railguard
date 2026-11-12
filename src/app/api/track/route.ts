import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/validation/rateLimiter";
import { getPublicComplaintTracking } from "@/services/complaintTrackingService";
import { z } from "zod";

const trackQuerySchema = z.object({
  complaintRef: z.string().min(5, "Complaint reference required"),
  trackingToken: z.string().min(16, "Tracking token must be at least 16 characters").max(64),
});

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting (Protection against token guessing)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const rateCheck = checkRateLimit(`track_${ip.split(",")[0].trim()}`, 20, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait ${rateCheck.resetInSeconds} seconds before trying again.`,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = trackQuerySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }

    // 2. Query Public Tracking Service
    const result = await getPublicComplaintTracking(
      parseResult.data.complaintRef,
      parseResult.data.trackingToken
    );

    if (!result.success || !result.complaint) {
      // Uniform error response (never disclose whether reference exists vs token mismatch)
      return NextResponse.json(
        { error: result.error || "Case record not found or invalid tracking credentials provided." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, complaint: result.complaint }, { status: 200 });
  } catch (error: unknown) {
    console.error("[POST /api/track] Error:", error);
    return NextResponse.json(
      { error: "Internal server error querying tracking record" },
      { status: 500 }
    );
  }
}
