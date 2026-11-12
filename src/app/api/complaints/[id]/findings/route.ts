import { NextRequest, NextResponse } from "next/server";
import { requireReviewer } from "@/lib/auth/session";
import { appendInvestigativeFindings } from "@/services/complaintMutationService";
import { InvestigationDetermination } from "@prisma/client";
import { z } from "zod";

const findingsSchema = z.object({
  findings: z.string().min(5, "Findings must be at least 5 characters long"),
  determination: z.nativeEnum(InvestigationDetermination).optional(),
  isCompleted: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authResult = await requireReviewer(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Authentication required" },
        { status: authResult.statusCode || 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = findingsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const result = await appendInvestigativeFindings({
      complaintId: id,
      findings: parseResult.data.findings,
      determination: parseResult.data.determination,
      isCompleted: parseResult.data.isCompleted,
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
    });

    return NextResponse.json({ success: true, investigation: result }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error appending findings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
