import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/validation/rateLimiter";
import { submitPassengerComplaint, EvidenceUploadInput } from "@/services/complaintSubmissionService";
import { ComplaintCategory, ComplaintSeverity } from "@prisma/client";
import { z } from "zod";

const submissionSchema = z.object({
  packagingQrCode: z.string().optional(),
  category: z.nativeEnum(ComplaintCategory, {
    message: "Invalid complaint category",
  }),
  severity: z.nativeEnum(ComplaintSeverity, {
    message: "Invalid severity level",
  }),
  description: z.string().min(10, "Description must be at least 10 characters long").max(2500),
  trainNumber: z.string().optional(),
  stationCode: z.string().optional(),
  coach: z.string().optional(),
  journeyDate: z.string().optional(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const rateCheck = checkRateLimit(ip.split(",")[0].trim(), 10, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many submissions from your address. Please try again in ${rateCheck.resetInSeconds} seconds.`,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await req.formData();

    const rawData = {
      packagingQrCode: formData.get("packagingQrCode")?.toString() || undefined,
      category: formData.get("category")?.toString() as ComplaintCategory,
      severity: (formData.get("severity")?.toString() as ComplaintSeverity) || ComplaintSeverity.MEDIUM,
      description: formData.get("description")?.toString() || "",
      trainNumber: formData.get("trainNumber")?.toString() || undefined,
      stationCode: formData.get("stationCode")?.toString() || undefined,
      coach: formData.get("coach")?.toString() || undefined,
      journeyDate: formData.get("journeyDate")?.toString() || undefined,
      contactEmail: formData.get("contactEmail")?.toString() || undefined,
      contactPhone: formData.get("contactPhone")?.toString() || undefined,
    };

    const parseResult = submissionSchema.safeParse(rawData);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    // 3. Extract Files
    const fileEntries = formData.getAll("evidence");
    const evidenceFiles: EvidenceUploadInput[] = [];

    for (const entry of fileEntries) {
      if (entry instanceof File && entry.size > 0) {
        if (evidenceFiles.length >= 3) {
          return NextResponse.json(
            { error: "Maximum of 3 evidence images permitted." },
            { status: 400 }
          );
        }
        const arrayBuffer = await entry.arrayBuffer();
        evidenceFiles.push({
          fileName: entry.name,
          declaredMimeType: entry.type,
          buffer: Buffer.from(arrayBuffer),
        });
      }
    }

    // 4. Submit Complaint
    const result = await submitPassengerComplaint({
      packagingQrCode: parseResult.data.packagingQrCode,
      category: parseResult.data.category,
      severity: parseResult.data.severity,
      description: parseResult.data.description,
      trainNumber: parseResult.data.trainNumber,
      stationCode: parseResult.data.stationCode,
      coach: parseResult.data.coach,
      journeyDate: parseResult.data.journeyDate ? new Date(parseResult.data.journeyDate) : undefined,
      contactEmail: parseResult.data.contactEmail || undefined,
      contactPhone: parseResult.data.contactPhone || undefined,
      evidenceFiles,
    });

    return NextResponse.json(
      {
        success: true,
        complaintRef: result.complaintRef,
        trackingToken: result.trackingToken, // Delivered to passenger once
        createdAt: result.createdAt,
        evidenceCount: result.evidenceCount,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error submitting complaint";
    console.error("[POST /api/complaints] Error:", error);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Invalid file") ? 400 : 500 }
    );
  }
}
