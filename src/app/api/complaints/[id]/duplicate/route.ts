import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/auth/session";
import { markComplaintAsDuplicate } from "@/services/duplicateDetectionService";
import { z } from "zod";

const duplicateSchema = z.object({
  originalComplaintRef: z.string().min(5, "Master complaint reference required"),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await resolveSession(req);
    if (!session.authenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const parseResult = duplicateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await markComplaintAsDuplicate({
      complaintId: id,
      originalComplaintRef: parseResult.data.originalComplaintRef,
      actorId: session.user.id,
      actorRole: session.user.role,
      notes: parseResult.data.notes,
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error marking duplicate";
    const status = msg.includes("UNAUTHORIZED") ? 403 : msg.includes("NOT_FOUND") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
