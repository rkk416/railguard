import { NextRequest, NextResponse } from "next/server";
import { requireReviewer } from "@/lib/auth/session";
import { createCorrectiveAction } from "@/services/complaintMutationService";
import { CorrectiveActionType } from "@prisma/client";
import { z } from "zod";

const actionSchema = z.object({
  actionType: z.nativeEnum(CorrectiveActionType),
  description: z.string().min(5, "Action description required"),
  responsibleParty: z.string().min(2, "Responsible vendor or party required"),
  deadline: z.string().datetime().optional().or(z.string().optional()),
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
    const parseResult = actionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const deadline = parseResult.data.deadline ? new Date(parseResult.data.deadline) : undefined;

    const result = await createCorrectiveAction({
      complaintId: id,
      actionType: parseResult.data.actionType,
      description: parseResult.data.description,
      responsibleParty: parseResult.data.responsibleParty,
      deadline,
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
    });

    return NextResponse.json({ success: true, correctiveAction: result }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating corrective action";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
