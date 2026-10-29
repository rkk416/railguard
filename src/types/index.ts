import type {
  User,
  Vendor,
  Product,
  PackagingUnit,
  Complaint,
  ComplaintEvidence,
  ComplaintEvent,
  Investigation,
  CorrectiveAction,
  RecurringIssueAlert,
  UserRole,
  VendorStatus,
  ProductCategory,
  PackagingStatus,
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
  InvestigationDetermination,
  CorrectiveActionType,
  CorrectiveActionStatus,
  AlertStatus,
} from "@prisma/client";

export type {
  User,
  Vendor,
  Product,
  PackagingUnit,
  Complaint,
  ComplaintEvidence,
  ComplaintEvent,
  Investigation,
  CorrectiveAction,
  RecurringIssueAlert,
  UserRole,
  VendorStatus,
  ProductCategory,
  PackagingStatus,
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
  InvestigationDetermination,
  CorrectiveActionType,
  CorrectiveActionStatus,
  AlertStatus,
};

export type PackagingVerificationStatus =
  | "VERIFIED"
  | "EXPIRED"
  | "RECALLED"
  | "UNRECOGNIZED";

export interface VerifiedProductDetails {
  status: PackagingVerificationStatus;
  isRecognized: boolean;
  isDemonstrationData: boolean;
  message: string;
  packagingUnit?: {
    id: string;
    batchNumber: string;
    packagingDate: string;
    expiryDate: string;
    qrCodeIdentifier: string;
    status: PackagingStatus;
  };
  product?: {
    id: string;
    name: string;
    category: ProductCategory;
    fssaiLicense: string;
    shelfLifeHours: number;
  };
  vendor?: {
    id: string;
    name: string;
    code: string;
    licenseNumber: string;
    status: VendorStatus;
  };
}

export interface QRGenerationOptions {
  identifier: string;
  baseUrl?: string;
  format?: "dataUrl" | "svg";
}
