import { prisma } from "@/lib/db/prisma";
import {
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
} from "@prisma/client";
import { generateTrackingToken, hashTrackingToken } from "@/lib/crypto/token";
import { validateEvidenceBuffer } from "@/lib/validation/evidenceFileValidation";
import { getUploadsDir } from "@/lib/storage/evidenceStorage";
import {
  isSupabaseStorageConfigured,
  uploadEvidenceToSupabase,
  deleteEvidenceFromSupabase,
} from "@/lib/storage/supabaseStorage";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface EvidenceUploadInput {
  fileName: string;
  declaredMimeType: string;
  buffer: Buffer;
}

export interface ComplaintSubmissionInput {
  packagingQrCode?: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  description: string;
  trainNumber?: string;
  stationCode?: string;
  coach?: string;
  journeyDate?: Date;
  contactEmail?: string;
  contactPhone?: string;
  evidenceFiles?: EvidenceUploadInput[];
}

export interface ComplaintSubmissionResult {
  complaintRef: string;
  trackingToken: string; // RAW token to be shown ONCE to passenger
  createdAt: string;
  evidenceCount: number;
}

/**
 * Generates an available, non-colliding complaint reference in format: RG-2026-XXXX
 */
async function generateUniqueComplaintRef(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 10; attempt++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digits
    const candidateRef = `RG-${year}-${randomSuffix}`;
    const existing = await prisma.complaint.findUnique({
      where: { complaintRef: candidateRef },
      select: { id: true },
    });
    if (!existing) {
      return candidateRef;
    }
  }
  // Fallback to timestamp-based suffix
  return `RG-${year}-${Date.now().toString().slice(-5)}`;
}

/**
 * Submits a new passenger complaint with server-side file signature validation
 * and cryptographic token hashing within an atomic transaction.
 */
export async function submitPassengerComplaint(
  input: ComplaintSubmissionInput
): Promise<ComplaintSubmissionResult> {
  // 1. Input Sanity Validation
  if (!input.description || input.description.trim().length < 10) {
    throw new Error("Complaint description must be at least 10 characters long.");
  }
  if (input.description.trim().length > 2500) {
    throw new Error("Complaint description cannot exceed 2500 characters.");
  }

  // 2. Validate Evidence Files (Max 3)
  const files = input.evidenceFiles || [];
  if (files.length > 3) {
    throw new Error("A maximum of 3 evidence images can be uploaded per complaint.");
  }

  const validatedFiles: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
    fileSizeBytes: number;
    extension: string;
  }[] = [];

  for (const f of files) {
    const check = validateEvidenceBuffer(f.buffer, f.declaredMimeType, f.fileName);
    if (!check.valid || !check.detectedMime || !check.extension) {
      throw new Error(`Invalid file "${f.fileName}": ${check.error}`);
    }
    validatedFiles.push({
      fileName: f.fileName,
      mimeType: check.detectedMime,
      buffer: f.buffer,
      fileSizeBytes: f.buffer.length,
      extension: check.extension,
    });
  }

  // 3. Resolve Relations
  // Packaging Unit Lookup
  let packagingUnitId: string | null = null;
  if (input.packagingQrCode && input.packagingQrCode.trim()) {
    const pkg = await prisma.packagingUnit.findUnique({
      where: { qrCodeIdentifier: input.packagingQrCode.trim() },
      select: { id: true },
    });
    if (pkg) packagingUnitId = pkg.id;
  }

  // Train Lookup
  let trainId: string | null = null;
  let unmatchedTrainNumber: string | null = null;
  if (input.trainNumber && input.trainNumber.trim()) {
    const trainNum = input.trainNumber.trim();
    const train = await prisma.train.findUnique({
      where: { trainNumber: trainNum },
      select: { id: true },
    });
    if (train) {
      trainId = train.id;
    } else {
      unmatchedTrainNumber = trainNum;
    }
  }

  // Station Lookup
  let stationId: string | null = null;
  if (input.stationCode && input.stationCode.trim()) {
    const stationCode = input.stationCode.trim().toUpperCase();
    const station = await prisma.station.findUnique({
      where: { code: stationCode },
      select: { id: true },
    });
    if (station) stationId = station.id;
  }

  // 4. Generate Reference & Cryptographic Token
  const complaintRef = await generateUniqueComplaintRef();
  const rawTrackingToken = generateTrackingToken(); // 32 hex chars
  const trackingTokenHash = hashTrackingToken(rawTrackingToken); // SHA-256

  // 5. Ensure Storage Directory Exists
  const uploadsDir = getUploadsDir();
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 6. Execute Transaction
  const writtenFiles: string[] = [];
  const supabaseUploadedPaths: string[] = [];
  const useSupabase = isSupabaseStorageConfigured();

  try {
    const complaint = await prisma.$transaction(async (tx) => {
      // Create Complaint Record
      const newComplaint = await tx.complaint.create({
        data: {
          complaintRef,
          trackingTokenHash,
          packagingUnitId,
          trainId,
          unmatchedTrainNumber,
          stationId,
          category: input.category,
          severity: input.severity,
          description: input.description.trim(),
          coach: input.coach?.trim() || null,
          journeyDate: input.journeyDate || null,
          contactEmail: input.contactEmail?.trim() || null,
          contactPhone: input.contactPhone?.trim() || null,
          status: ComplaintStatus.SUBMITTED,
        },
      });

      // Save Files & Create Evidence Records
      for (const f of validatedFiles) {
        const uniqueFileName = `${crypto.randomUUID()}${f.extension}`;
        const relativePath = `uploads/${uniqueFileName}`;
        const targetPath = path.join(uploadsDir, uniqueFileName);

        // Upload to Supabase Storage if configured
        if (useSupabase) {
          const uploadResult = await uploadEvidenceToSupabase(relativePath, f.buffer, f.mimeType);
          if (!uploadResult.success) {
            throw new Error(`Failed to upload evidence to secure storage: ${uploadResult.error}`);
          }
          supabaseUploadedPaths.push(relativePath);
        }

        // Write buffer to local/tmp storage as local fallback
        try {
          fs.writeFileSync(targetPath, f.buffer);
          writtenFiles.push(targetPath);
        } catch {
          // In read-only serverless filesystems without /tmp permission, continue if Supabase succeeded
          if (!useSupabase) {
            throw new Error("Unable to persist evidence asset to storage.");
          }
        }

        await tx.complaintEvidence.create({
          data: {
            complaintId: newComplaint.id,
            storagePath: relativePath,
            fileName: f.fileName,
            fileSizeBytes: f.fileSizeBytes,
            mimeType: f.mimeType,
          },
        });
      }

      // Create Initial Timeline Event
      await tx.complaintEvent.create({
        data: {
          complaintId: newComplaint.id,
          actorRole: "PASSENGER",
          newStatus: ComplaintStatus.SUBMITTED,
          explanation: "Complaint submitted by passenger via digital reporting portal.",
          isPublic: true,
        },
      });

      return newComplaint;
    });

    return {
      complaintRef: complaint.complaintRef,
      trackingToken: rawTrackingToken, // Displayed to passenger once
      createdAt: complaint.createdAt.toISOString(),
      evidenceCount: validatedFiles.length,
    };
  } catch (err: unknown) {
    // If database transaction failed, clean up any written files on disk & Supabase
    for (const p of writtenFiles) {
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch { /* ignore */ }
      }
    }
    if (supabaseUploadedPaths.length > 0) {
      deleteEvidenceFromSupabase(supabaseUploadedPaths).catch((cleanupErr) => {
        console.warn("[ComplaintSubmission] Failed to rollback Supabase files:", cleanupErr);
      });
    }
    throw err;
  }
}
