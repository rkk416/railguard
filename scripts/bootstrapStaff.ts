import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const targetUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: targetUrl ? { db: { url: targetUrl } } : undefined,
});

interface BootstrapConfig {
  email: string;
  name: string;
  role: UserRole;
  password?: string;
}

/**
 * Headless Staff Bootstrap Routine
 *
 * Designed to execute safely during initial deployment or container boot.
 * Reads administrator-configured credentials from private environment variables.
 * Never logs plaintext passwords or overwrites existing accounts.
 */
export async function bootstrapStaffAccounts(dryRun = false) {
  console.log("=================================================================");
  console.log("  RailGuard — Production Staff Bootstrap Engine");
  console.log("=================================================================");

  const configs: BootstrapConfig[] = [
    {
      email: (process.env.INITIAL_ADMIN_EMAIL || "").toLowerCase().trim(),
      name: process.env.INITIAL_ADMIN_NAME || "RailGuard System Administrator",
      role: UserRole.ADMIN,
      password: process.env.INITIAL_ADMIN_PASSWORD,
    },
    {
      email: (process.env.INITIAL_REVIEWER_EMAIL || "").toLowerCase().trim(),
      name: process.env.INITIAL_REVIEWER_NAME || "RailGuard Quality Reviewer",
      role: UserRole.QUALITY_REVIEWER,
      password: process.env.INITIAL_REVIEWER_PASSWORD,
    },
  ];

  let provisionedCount = 0;
  let skippedCount = 0;

  for (const cfg of configs) {
    if (!cfg.email) {
      console.log(`[Staff Bootstrap] Notice: No email configured for ${cfg.role} (skipping auto-provision).`);
      continue;
    }

    // 1. Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cfg.email },
    });

    if (existing) {
      console.log(`[Staff Bootstrap] User "${cfg.email}" already exists with role [${existing.role}].`);
      console.log(`  -> Safety Guard: Preserved existing credentials and privileges.`);
      skippedCount++;
      continue;
    }

    // 2. Validate password requirement
    if (!cfg.password || cfg.password.length < 8) {
      console.warn(`[Staff Bootstrap] Warning: Password for "${cfg.email}" is either missing or shorter than 8 characters.`);
      console.warn(`  -> Account not created automatically. Use "npm run staff:provision" for interactive provisioning.`);
      continue;
    }

    if (dryRun) {
      console.log(`[Staff Bootstrap DRY-RUN] Would safely provision account: ${cfg.email} (${cfg.name}, Role: ${cfg.role})`);
      provisionedCount++;
      continue;
    }

    // 3. Compute memory-hard scrypt hash
    const passwordHash = hashPassword(cfg.password);

    // 4. Safe atomic insert
    const created = await prisma.user.create({
      data: {
        email: cfg.email,
        name: cfg.name,
        role: cfg.role,
        passwordHash,
      },
    });

    console.log(`[Staff Bootstrap] SUCCESS: Initialized ${cfg.role} account for "${created.email}" (ID: ${created.id}).`);
    provisionedCount++;
  }

  console.log("=================================================================");
  console.log(`  Bootstrap Summary: ${provisionedCount} provisioned, ${skippedCount} existing preserved.`);
  console.log("=================================================================");

  return { provisionedCount, skippedCount };
}

// Execute CLI entry point if run directly
if (require.main === module || process.argv[1]?.includes("bootstrapStaff")) {
  const isDryRun = process.argv.includes("--dry-run");

  bootstrapStaffAccounts(isDryRun)
    .catch((err) => {
      console.error("[Staff Bootstrap] Execution failed:", err.message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
