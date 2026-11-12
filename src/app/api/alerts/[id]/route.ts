import { NextRequest, NextResponse } from "next/server";
import { resolveSession } from "@/lib/auth/session";
import { updateAlertStatus } from "@/services/recurringAlertService";
import { AlertStatus } from "@prisma/client";
import { z } from "zod";

const patchAlertSchema = z.object({
  status: z.nativeEnum(AlertStatus, {
    message: "Invalid alert status",
  }),
});

export async function PATCH(
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
    const parseResult = patchAlertSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await updateAlertStatus(
      id,
      parseResult.data.status,
      session.user.role
    );

    return NextResponse.json({ success: true, alert: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating alert";
    const status = msg.includes("UNAUTHORIZED") ? 403 : msg.includes("NOT_FOUND") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
