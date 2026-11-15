import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveSession } from "@/lib/auth/session";
import { verifyEvidenceAccessToken } from "@/lib/crypto/token";
import { getEvidenceBasePath } from "@/lib/storage/evidenceStorage";
import { generateDemoSvg } from "@/lib/storage/demoEvidence";
import {
  isSupabaseStorageConfigured,
  downloadEvidenceFromSupabase,
} from "@/lib/storage/supabaseStorage";
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
    const basePath = getEvidenceBasePath();
    const filePath = path.resolve(basePath, evidence.storagePath);

    // Defense-in-depth: Prevent directory traversal
    if (!filePath.startsWith(basePath)) {
      return NextResponse.json({ error: "Invalid storage path detected" }, { status: 400 });
    }

    let fileBuffer: Buffer | null = null;
    let resolvedMimeType = evidence.mimeType || "image/svg+xml";

    if (fs.existsSync(filePath)) {
      fileBuffer = fs.readFileSync(filePath);
    } else if (isSupabaseStorageConfigured()) {
      const supabaseRes = await downloadEvidenceFromSupabase(evidence.storagePath);
      if (supabaseRes.success && supabaseRes.buffer) {
        fileBuffer = supabaseRes.buffer;
        if (supabaseRes.mimeType) resolvedMimeType = supabaseRes.mimeType;
      }
    }

    if (!fileBuffer && evidence.storagePath.startsWith("demo/")) {
      // Dynamic fallback for demo SVG assets on serverless/ephemeral instances
      const demoSvg = generateDemoSvg(
        evidence.fileName.replace(/\.svg$/, "").replace(/^demo_/, "").replace(/_/g, " "),
        "SYNTHETIC_SPECIMEN",
        evidence.id.slice(0, 8).toUpperCase()
      );
      fileBuffer = Buffer.from(demoSvg, "utf-8");
      resolvedMimeType = "image/svg+xml";
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: "Evidence asset not found on disk or storage" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": resolvedMimeType,
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
