import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

interface ProvisionOptions {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

function parseArgs(): ProvisionOptions | null {
  const args = process.argv.slice(2);
  const options: Partial<ProvisionOptions> = {
    email: process.env.STAFF_EMAIL,
    name: process.env.STAFF_NAME,
    password: process.env.STAFF_PASSWORD,
  };

  if (process.env.STAFF_ROLE) {
    options.role = process.env.STAFF_ROLE as UserRole;
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) options.email = args[++i];
    if (args[i] === "--name" && args[i + 1]) options.name = args[++i];
    if (args[i] === "--role" && args[i + 1]) options.role = args[++i] as UserRole;
    if (args[i] === "--password" && args[i + 1]) options.password = args[++i];
  }

  if (!options.email || !options.name || !options.role || !options.password) {
    return null;
  }

  if (options.role !== UserRole.ADMIN && options.role !== UserRole.QUALITY_REVIEWER) {
    console.error(`Invalid role: ${options.role}. Allowed roles: ADMIN, QUALITY_REVIEWER`);
    process.exit(1);
  }

  return options as ProvisionOptions;
}

async function main() {
  const options = parseArgs();

  if (!options) {
    console.log("=== RailGuard Administrator Staff Account Provisioner ===");
    console.log("Usage:");
    console.log("  npx tsx scripts/provisionStaff.ts --email <email> --name <name> --role <ADMIN|QUALITY_REVIEWER> --password <password>");
    console.log("");
    console.log("Environment variables alternative:");
    console.log("  STAFF_EMAIL=... STAFF_NAME=... STAFF_ROLE=... STAFF_PASSWORD=... npx tsx scripts/provisionStaff.ts");
    process.exit(1);
  }

  console.log(`[Staff Provisioning] Provisioning account for: ${options.email} (Role: ${options.role})`);

  const passwordHash = hashPassword(options.password);

  const user = await prisma.user.upsert({
    where: { email: options.email.toLowerCase().trim() },
    update: {
      name: options.name.trim(),
      role: options.role,
      passwordHash,
    },
    create: {
      email: options.email.toLowerCase().trim(),
      name: options.name.trim(),
      role: options.role,
      passwordHash,
    },
  });

  console.log(`[Staff Provisioning] SUCCESS: User ID ${user.id} has been provisioned with role ${user.role}.`);
}

main()
  .catch((err) => {
    console.error("[Staff Provisioning] Failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
