import QRCode from "qrcode";

export interface GenerateQrResult {
  targetUrl: string;
  dataUrl: string;
}

/**
 * Builds the canonical passenger reporting URL for a given packaging identifier.
 */
export function buildReportUrl(identifier: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const encodedIdentifier = encodeURIComponent(identifier.trim());
  return `${cleanBase}/report?p=${encodedIdentifier}`;
}

/**
 * Generates a QR code Data URL (base64 image/png) for a packaging unit identifier.
 */
export async function generateQrDataUrl(
  identifier: string,
  baseUrl?: string
): Promise<GenerateQrResult> {
  const targetUrl = buildReportUrl(identifier, baseUrl);
  const dataUrl = await QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: {
      dark: "#0f172a", // slate-900
      light: "#ffffff",
    },
  });

  return { targetUrl, dataUrl };
}

/**
 * Generates a QR code SVG string for high-resolution vector display.
 */
export async function generateQrSvg(
  identifier: string,
  baseUrl?: string
): Promise<{ targetUrl: string; svg: string }> {
  const targetUrl = buildReportUrl(identifier, baseUrl);
  const svg = await QRCode.toString(targetUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  return { targetUrl, svg };
}
