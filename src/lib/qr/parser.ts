/**
 * RailGuard QR Content Parser and Sanitizer
 *
 * Extracts and validates packaging identifiers from raw QR scan payloads or manual input.
 * Supports:
 *  - Raw packaging identifiers: "DEMO-THALI-ACTIVE-001"
 *  - Canonical passenger report URLs: "https://.../report?p=DEMO-THALI-ACTIVE-001"
 *  - Canonical product inspection URLs: "https://.../products/DEMO-THALI-ACTIVE-001"
 *  - Relative URLs: "/products/DEMO-THALI-ACTIVE-001", "/report?p=..."
 *
 * Rejects:
 *  - Empty / whitespace inputs
 *  - External or untrusted domain URLs
 *  - Malformed strings containing script tags, special injection characters, or spaces
 */

export interface QrParseResult {
  valid: boolean;
  identifier?: string;
  error?: string;
  sourceType?: "raw_identifier" | "railguard_report_url" | "railguard_product_url";
}

// Allowed character set for valid RailGuard packaging identifiers
// Letters, numbers, hyphens, underscores, dots, colons (length: 3 to 100)
const VALID_IDENTIFIER_REGEX = /^[A-Za-z0-9_.:-]{3,100}$/;

function isAllowedRailGuardHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  // Local development and internal test environments
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    return true;
  }

  // Official production and staging domains
  if (
    host.endsWith(".render.com") ||
    host.endsWith(".railguard.gov.in") ||
    host === "railguard.gov.in" ||
    host.includes("railguard")
  ) {
    return true;
  }

  // Explicitly configured app URL from environment
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase();
      if (host === appHost) return true;
    } catch {
      // Ignore URL parse error
    }
  }

  return false;
}

export function parseQrContent(rawInput: unknown): QrParseResult {
  if (typeof rawInput !== "string") {
    return {
      valid: false,
      error: "QR code content must be a text string.",
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "QR code content is empty.",
    };
  }

  // 1. Detect if input is a URL (starts with http:, https:, or relative /)
  const isHttpUrl = /^https?:\/\//i.test(trimmed);
  const isRelativeUrl = trimmed.startsWith("/") && (trimmed.includes("/report") || trimmed.includes("/products/"));

  if (isHttpUrl || isRelativeUrl) {
    try {
      // Use a dummy origin for relative URL parsing if needed
      const parsedUrl = isHttpUrl
        ? new URL(trimmed)
        : new URL(trimmed, "https://railguard.internal");

      // Verify domain if absolute HTTP(S) URL
      if (isHttpUrl && !isAllowedRailGuardHost(parsedUrl.hostname)) {
        return {
          valid: false,
          error: "Unrecognized QR code destination. The scanned QR code belongs to an external domain.",
        };
      }

      const pathname = parsedUrl.pathname.toLowerCase();

      // Check for /report?p=... or /report?qr=... or /report?id=...
      if (pathname.endsWith("/report") || pathname === "/report") {
        const pParam =
          parsedUrl.searchParams.get("p") ||
          parsedUrl.searchParams.get("qr") ||
          parsedUrl.searchParams.get("id");

        if (pParam) {
          const decoded = decodeURIComponent(pParam).trim();
          if (VALID_IDENTIFIER_REGEX.test(decoded)) {
            return {
              valid: true,
              identifier: decoded,
              sourceType: "railguard_report_url",
            };
          }
          return {
            valid: false,
            error: "The report URL parameter contains an invalid packaging identifier format.",
          };
        }

        return {
          valid: false,
          error: "The scanned QR report URL is missing a packaging identifier parameter (?p=...).",
        };
      }

      // Check for /products/<identifier>
      const productMatch = parsedUrl.pathname.match(/\/products\/([^/?#]+)/i);
      if (productMatch && productMatch[1]) {
        const decoded = decodeURIComponent(productMatch[1]).trim();
        if (VALID_IDENTIFIER_REGEX.test(decoded)) {
          return {
            valid: true,
            identifier: decoded,
            sourceType: "railguard_product_url",
          };
        }
        return {
          valid: false,
          error: "The product URL contains an invalid packaging identifier format.",
        };
      }

      // If it is an external URL that does not match RailGuard routes, reject
      return {
        valid: false,
        error: "Unrecognized QR code destination. The scanned QR code does not belong to the RailGuard registry.",
      };
    } catch {
      return {
        valid: false,
        error: "Malformed URL in scanned QR code.",
      };
    }
  }

  // 2. Treat as raw packaging identifier
  // Remove accidental surrounding quotes
  const cleanId = trimmed.replace(/^["']|["']$/g, "").trim();

  if (!VALID_IDENTIFIER_REGEX.test(cleanId)) {
    return {
      valid: false,
      error:
        "Malformed packaging identifier. Must contain only letters, numbers, hyphens, and underscores (3-100 characters).",
    };
  }

  return {
    valid: true,
    identifier: cleanId,
    sourceType: "raw_identifier",
  };
}
