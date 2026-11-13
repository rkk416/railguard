import fs from "fs";
import path from "path";
import { getDemoDir } from "./evidenceStorage";

export interface DemoEvidenceAsset {
  fileName: string;
  relativePath: string;
  mimeType: string;
  fileSizeBytes: number;
  label: string;
}

/**
 * Creates an SVG image buffer for synthetic demonstration evidence.
 * Explicitly branded with "DEMO ASSET — NOT A REAL INCIDENT" to prevent confusion.
 */
export function generateDemoSvg(title: string, category: string, ref: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.3"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg)" />
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Frame Border -->
  <rect x="20" y="20" width="760" height="560" rx="12" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="8 6"/>

  <!-- Warning Banner -->
  <rect x="40" y="40" width="720" height="60" rx="8" fill="#991b1b" fill-opacity="0.9" />
  <text x="400" y="78" fill="#fef2f2" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" text-anchor="middle" letter-spacing="2">
    ⚠️ DEMO ASSET — NOT A REAL INCIDENT
  </text>

  <!-- Evidence Details Card -->
  <rect x="60" y="130" width="680" height="360" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>

  <!-- Inspection Metadata -->
  <text x="90" y="180" fill="#94a3b8" font-family="monospace" font-size="14" font-weight="600">
    EVIDENCE CLASSIFICATION: <tspan fill="#38bdf8">${category}</tspan>
  </text>
  <text x="90" y="215" fill="#94a3b8" font-family="monospace" font-size="14" font-weight="600">
    CASE REFERENCE: <tspan fill="#facc15">${ref}</tspan>
  </text>
  <text x="90" y="250" fill="#94a3b8" font-family="monospace" font-size="14" font-weight="600">
    SPECIMEN DESCRIPTION: <tspan fill="#e2e8f0">${title}</tspan>
  </text>

  <!-- Center Graphic Placeholder -->
  <circle cx="400" cy="350" r="70" fill="#0f172a" stroke="#64748b" stroke-width="2"/>
  <path d="M 375 350 L 395 370 L 430 330" fill="none" stroke="#22c55e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="400" y="445" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13" text-anchor="middle">
    Synthetically Rendered Food Quality Inspection Specimen
  </text>

  <!-- Legal & Audit Disclaimer -->
  <rect x="60" y="515" width="680" height="45" rx="6" fill="#020617" fill-opacity="0.8"/>
  <text x="400" y="542" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">
    RailGuard Academic Platform Demonstration Record • Digital Watermark ID: RG-${ref} • Non-Production Asset
  </text>
</svg>`;
}

/**
 * Ensures baseline synthetic evidence images exist on the filesystem.
 * Returns metadata list of available demonstration files.
 */
export function ensureDemoEvidenceAssets(): DemoEvidenceAsset[] {
  const baseStorageDir = getDemoDir();
  if (!fs.existsSync(baseStorageDir)) {
    fs.mkdirSync(baseStorageDir, { recursive: true });
  }

  const specs = [
    { name: "demo_spoilage_curd.svg", category: "SPOILAGE", title: "Sour / curdled dairy consistency in meal tray", ref: "DEMO-001" },
    { name: "demo_foreign_object_foil.svg", category: "FOREIGN_OBJECT", title: "Aluminium foil fragment discovered in dal", ref: "DEMO-002" },
    { name: "demo_packaging_seal_broken.svg", category: "HYGIENE_PACKAGING", title: "Tampered packaging seal on breakfast combo", ref: "DEMO-003" },
    { name: "demo_temperature_cold_meal.svg", category: "TEMPERATURE", title: "Sub-ambient serving temperature recorded", ref: "DEMO-004" },
    { name: "demo_product_mismatch.svg", category: "PRODUCT_MISMATCH", title: "Non-vegetarian item served instead of Jain thali", ref: "DEMO-005" },
    { name: "demo_water_seal_defect.svg", category: "HYGIENE_PACKAGING", title: "Broken bottle neck seal on packaged water", ref: "DEMO-006" },
  ];

  const results: DemoEvidenceAsset[] = [];

  for (const s of specs) {
    const filePath = path.join(baseStorageDir, s.name);
    const content = generateDemoSvg(s.title, s.category, s.ref);
    fs.writeFileSync(filePath, content, "utf-8");
    const stats = fs.statSync(filePath);

    results.push({
      fileName: s.name,
      relativePath: `demo/${s.name}`,
      mimeType: "image/svg+xml",
      fileSizeBytes: stats.size,
      label: s.title,
    });
  }

  return results;
}
