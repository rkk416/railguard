import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveSession } from "@/lib/auth/session";
import { verifyEvidenceAccessToken } from "@/lib/crypto/token";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const evidence = await prisma.complaintEvidence.findUnique({
      where: { id },
      include: {
        complaint: {
          select: { id: true },
        },
      },
    });

    if (!evidence) {
      return NextResponse.json({ error: "Evidence asset not found" }, { status: 404 });
    }

    // Authorization: Requires authenticated reviewer/admin session OR short-lived evidence access token
    const session = await resolveSession(req);
    const evidenceToken = req.nextUrl.searchParams.get("evidenceToken");

    let isAuthorized = session.authenticated;
    if (!isAuthorized && evidenceToken) {
      isAuthorized = verifyEvidenceAccessToken(
        evidenceToken,
        evidence.id,
        evidence.complaint.id
      );
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Reviewer session or valid evidence access token required." },
        { status: 403 }
      );
    }

    // Resolve file from private evidence_storage/ (never from public/)
    const basePath = path.resolve(process.cwd(), "evidence_storage");
    const filePath = path.resolve(basePath, evidence.storagePath);

    // Defense-in-depth: Prevent directory traversal
    if (!filePath.startsWith(basePath)) {
      return NextResponse.json({ error: "Invalid storage path detected" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Evidence asset not found on disk" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": evidence.mimeType || "image/svg+xml",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Content-Disposition": `inline; filename="${encodeURIComponent(evidence.fileName)}"`,
      },
    });
  } catch (error: unknown) {
    console.error("[GET /api/evidence/[id]] Streaming error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
