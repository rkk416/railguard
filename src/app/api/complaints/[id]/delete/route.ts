import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { softDeleteComplaint } from "@/services/complaintMutationService";
import { z } from "zod";

const deleteSchema = z.object({
  deletedReason: z.string().min(5, "Administrative deletion reason required"),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Strict ADMIN only guard
    const authResult = await requireAdmin(req);
    if (!authResult.authorized || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Administrator privileges required" },
        { status: authResult.statusCode || 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = deleteSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const result = await softDeleteComplaint({
      complaintId: id,
      deletedReason: parseResult.data.deletedReason,
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
    });

    return NextResponse.json({ success: true, complaint: result }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error executing soft deletion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
