import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { executeDemoReset } from "@/services/demoResetService";
import { z } from "zod";

const resetPayloadSchema = z.object({
  confirm: z.literal("RESET_DEMO_DATABASE", {
    message: 'Explicit confirmation required. Payload must be { confirm: "RESET_DEMO_DATABASE" }',
  }),
});

export async function POST(req: NextRequest) {
  try {
    // 0. Production Safety Guard
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_RESET !== "true") {
      return NextResponse.json(
        {
          error: "Demonstration database reset is disabled in production environments.",
          code: "PRODUCTION_GUARD_ACTIVE",
        },
        { status: 403 }
      );
    }

    // 1. Strict Server-Side RBAC Guard
    const authResult = await requireAdmin(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json(
        {
          error: authResult.error || "Forbidden: Administrator privileges required.",
          code: authResult.statusCode === 401 ? "UNAUTHENTICATED" : "FORBIDDEN",
        },
        { status: authResult.statusCode || 403 }
      );
    }

    // 2. CSRF / Origin Guard
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "CSRF verification failed: Origin header mismatch.", code: "CSRF_DETECTED" },
          { status: 403 }
        );
      }
    }

    // 3. Payload Validation
    const body = await req.json().catch(() => ({}));
    const parseResult = resetPayloadSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          error: issue?.message || "Invalid payload",
          code: "INVALID_CONFIRMATION",
        },
        { status: 400 }
      );
    }

    // 4. Execute Demonstration Reset Service
    const result = await executeDemoReset({
      confirm: String(parseResult.data.confirm),
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      actorEmail: authResult.user.email,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error during demo reset";
    console.error("[POST /api/demo/reset] Fatal error:", error);
    return NextResponse.json(
      { error: message, code: "RESET_FAILED" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Reset is a destructive action requiring POST with confirmation." },
    { status: 405 }
  );
}
