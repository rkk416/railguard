import { prisma } from "@/lib/db/prisma";
import type { VerifiedProductDetails } from "@/types";

/**
 * Looks up and verifies a packaging unit by its unique QR identifier.
 * Distinguishes between verified records, expired batches, recalled products,
 * and unrecognized identifiers.
 */
export async function verifyPackagingUnit(
  identifier: string
): Promise<VerifiedProductDetails> {
  const cleanId = identifier?.trim();

  if (!cleanId) {
    return {
      status: "UNRECOGNIZED",
      isRecognized: false,
      isDemonstrationData: true,
      message: "No packaging identifier was provided.",
    };
  }

  try {
    const packagingUnit = await prisma.packagingUnit.findUnique({
      where: { qrCodeIdentifier: cleanId },
      include: {
        product: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!packagingUnit) {
      return {
        status: "UNRECOGNIZED",
        isRecognized: false,
        isDemonstrationData: true,
        message:
          "Unregistered packaging identifier. This batch is not listed in the demonstration registry, but you may still submit an unverified complaint.",
      };
    }

    const now = new Date();
    const isExpired =
      packagingUnit.status === "EXPIRED" || now > packagingUnit.expiryDate;
    const isRecalled = packagingUnit.status === "RECALLED";

    let status: VerifiedProductDetails["status"] = "VERIFIED";
    let message =
      "Packaging record verified successfully against demonstration railway registry.";

    if (isRecalled) {
      status = "RECALLED";
      message =
        "WARNING: This product batch has been flagged as RECALLED by quality oversight.";
    } else if (isExpired) {
      status = "EXPIRED";
      message =
        "WARNING: This packaging batch has exceeded its recorded expiry date.";
    }

    return {
      status,
      isRecognized: true,
      isDemonstrationData: true,
      message,
      packagingUnit: {
        id: packagingUnit.id,
        batchNumber: packagingUnit.batchNumber,
        packagingDate: packagingUnit.packagingDate.toISOString(),
        expiryDate: packagingUnit.expiryDate.toISOString(),
        qrCodeIdentifier: packagingUnit.qrCodeIdentifier,
        status: packagingUnit.status,
      },
      product: {
        id: packagingUnit.product.id,
        name: packagingUnit.product.name,
        category: packagingUnit.product.category,
        fssaiLicense: packagingUnit.product.fssaiLicense,
        shelfLifeHours: packagingUnit.product.shelfLifeHours,
      },
      vendor: {
        id: packagingUnit.product.vendor.id,
        name: packagingUnit.product.vendor.name,
        code: packagingUnit.product.vendor.code,
        licenseNumber: packagingUnit.product.vendor.licenseNumber,
        status: packagingUnit.product.vendor.status,
      },
    };
  } catch (error) {
    // Graceful error handling for missing database connections in tests or offline environments
    console.error("Database error during packaging verification:", error);
    return {
      status: "UNRECOGNIZED",
      isRecognized: false,
      isDemonstrationData: true,
      message:
        "Unable to query packaging registry at this time. You may still file an unverified report.",
    };
  }
}
