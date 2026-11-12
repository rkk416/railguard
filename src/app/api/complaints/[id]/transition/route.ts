import { NextRequest, NextResponse } from "next/server";
import { requireReviewer } from "@/lib/auth/session";
import { transitionComplaintStatus } from "@/services/complaintMutationService";
import { ComplaintStatus } from "@prisma/client";
import { z } from "zod";

const transitionSchema = z.object({
  targetStatus: z.nativeEnum(ComplaintStatus, {
    message: "Invalid target complaint status",
  }),
  explanation: z.string().min(3, "Explanation must be at least 3 characters long"),
  rejectionReason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. RBAC Guard: Quality Reviewer or Admin required
    const authResult = await requireReviewer(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: authResult.statusCode || 401 }
      );
    }

    // 2. Parse & Validate Payload
    const body = await req.json().catch(() => ({}));
    const parseResult = transitionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    // 3. Execute State Transition
    const updated = await transitionComplaintStatus({
      complaintId: id,
      targetStatus: parseResult.data.targetStatus,
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      explanation: parseResult.data.explanation,
      rejectionReason: parseResult.data.rejectionReason,
    });

    return NextResponse.json({ success: true, complaint: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error executing transition";
    const status = message.includes("INVALID_TRANSITION")
      ? 422
      : message.includes("NOT_FOUND")
      ? 44
      : message.includes("VALIDATION_ERROR")
      ? 400
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
