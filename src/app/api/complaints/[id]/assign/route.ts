import { NextRequest, NextResponse } from "next/server";
import { requireReviewer } from "@/lib/auth/session";
import { assignInvestigator } from "@/services/complaintMutationService";
import { z } from "zod";

const assignSchema = z.object({
  investigatorId: z.string().uuid("Invalid investigator user ID"),
  notes: z.string().optional(),
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
    const parseResult = assignSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const result = await assignInvestigator({
      complaintId: id,
      investigatorId: parseResult.data.investigatorId,
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      notes: parseResult.data.notes,
    });

    return NextResponse.json({ success: true, investigation: result }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error assigning investigator";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
