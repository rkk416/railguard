import { PrismaClient, UserRole } from "@prisma/client";
import readline from "readline";
import { hashPassword } from "../src/lib/auth/password";

// Prioritize DIRECT_URL for direct connection to Supabase PostgreSQL, fallback to DATABASE_URL
const targetUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: targetUrl ? { db: { url: targetUrl } } : undefined,
});

/**
 * Standard line prompt for non-sensitive fields.
 */
function promptText(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Masked password prompt that hides keystrokes with '*' or blanks.
 * Never displays plaintext passwords or writes them to shell history.
 */
export function promptHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(query);
    const stdin = process.stdin;

    // Non-interactive fallback (e.g., CI/CD or piped input)
    if (!stdin.isTTY) {
      let buf = "";
      const onData = (chunk: Buffer) => {
        buf += chunk.toString();
        if (buf.includes("\n") || buf.includes("\r")) {
          stdin.removeListener("data", onData);
          resolve(buf.replace(/[\r\n]/g, "").trim());
        }
      };
      stdin.on("data", onData);
      return;
    }

    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";

    const onData = (char: string) => {
      // Enter key (CR or LF)
      if (char === "\n" || char === "\r" || char === "\u0004") {
        stdin.removeListener("data", onData);
        stdin.setRawMode(wasRaw || false);
        stdin.pause();
        process.stdout.write("\n");
        resolve(password);
      }
      // Ctrl+C (Interrupt)
      else if (char === "\u0003") {
        stdin.removeListener("data", onData);
        stdin.setRawMode(wasRaw || false);
        process.stdout.write("\n[Staff Provisioning] Aborted by administrator.\n");
        process.exit(1);
      }
      // Backspace (\x08 or \x7f)
      else if (char === "\u0008" || char === "\x7f") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write("\b \b");
        }
      }
      // Printable characters
      else {
        password += char;
        process.stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

interface ParsedCliArgs {
  email?: string;
  name?: string;
  role?: string;
  password?: string;
  isUpdate: boolean;
  allowDemotion: boolean;
}

function parseCliArgs(): ParsedCliArgs {
  const args = process.argv.slice(2);
  const result: ParsedCliArgs = {
    email: process.env.STAFF_EMAIL,
    name: process.env.STAFF_NAME,
    role: process.env.STAFF_ROLE,
    password: process.env.STAFF_PASSWORD,
    isUpdate: false,
    allowDemotion: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--email" && args[i + 1]) result.email = args[++i];
    else if (arg === "--name" && args[i + 1]) result.name = args[++i];
    else if (arg === "--role" && args[i + 1]) result.role = args[++i];
    else if (arg === "--password" && args[i + 1]) result.password = args[++i];
    else if (arg === "--update") result.isUpdate = true;
    else if (arg === "--allow-demotion") result.allowDemotion = true;
  }

  return result;
}

export function validateRole(roleInput: string): UserRole | null {
  const normalized = roleInput.trim().toUpperCase();
  if (normalized === "ADMIN" || normalized === "1") {
    return UserRole.ADMIN;
  }
  if (normalized === "QUALITY_REVIEWER" || normalized === "REVIEWER" || normalized === "2") {
    return UserRole.QUALITY_REVIEWER;
  }
  return null;
}

export async function executeProvisioningFlow() {
  const cliArgs = parseCliArgs();

  console.log("=================================================================");
  console.log("  RailGuard — Staff Account Provisioner (Supabase PostgreSQL)");
  console.log("=================================================================");

  // 1. Resolve Work Email
  let email = cliArgs.email;
  if (!email) {
    email = await promptText("Work Email Address: ");
  }
  email = email.toLowerCase().trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`[Error] Invalid email address format: "${email}".`);
    process.exit(1);
  }

  // 2. Check existing user in target database to prevent accidental overwrites
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && !cliArgs.isUpdate) {
    console.error(`\n[Safety Guard] An account with email "${email}" already exists in the database.`);
    console.error(`- Existing Name: ${existingUser.name}`);
    console.error(`- Existing Role: ${existingUser.role}`);
    console.error(`\nTo modify or reset credentials for this existing user, pass the --update flag:`);
    console.error(`  npm run staff:provision -- --email "${email}" --update\n`);
    process.exit(1);
  }

  // 3. Resolve Full Name
  let name = cliArgs.name;
  if (!name) {
    name = await promptText(
      existingUser
        ? `Full Name [press Enter to keep "${existingUser.name}"]: `
        : "Full Name (e.g. Priya Sharma): "
    );
    if (!name && existingUser) {
      name = existingUser.name;
    }
  }
  name = name.trim();
  if (!name) {
    console.error("[Error] Staff member full name is required.");
    process.exit(1);
  }

  // 4. Resolve and Validate Role
  let role: UserRole | null = null;
  if (cliArgs.role) {
    role = validateRole(cliArgs.role);
  }

  if (!role) {
    const rolePrompt = existingUser
      ? `Role (1 = ADMIN, 2 = QUALITY_REVIEWER) [press Enter to keep "${existingUser.role}"]: `
      : "Role (1 = ADMIN, 2 = QUALITY_REVIEWER): ";
    const roleInput = await promptText(rolePrompt);
    if (!roleInput && existingUser) {
      role = existingUser.role;
    } else {
      role = validateRole(roleInput);
    }
  }

  if (!role) {
    console.error("\n[Error] Invalid role. Allowed roles in RailGuard schema:");
    console.error("  - ADMIN (Director / Lead Quality Auditor)");
    console.error("  - QUALITY_REVIEWER (On-train / Station Catering Inspector)");
    process.exit(1);
  }

  // Safety Guard: Refuse demoting an existing Admin without explicit flag
  if (existingUser && existingUser.role === UserRole.ADMIN && role !== UserRole.ADMIN && !cliArgs.allowDemotion) {
    console.error(`\n[Security Alert] Refusing to demote existing ADMINISTRATOR "${email}" to "${role}".`);
    console.error(`To explicitly permit administrative privilege demotion, pass --allow-demotion.`);
    process.exit(1);
  }

  // 5. Secure Password Entry (Never displayed or recorded in shell history)
  let password = cliArgs.password;
  if (password) {
    console.warn("\n[Warning] Providing passwords via command-line flags or environment variables may expose them in shell history.");
    console.warn("For maximum security, omit the --password flag to use interactive masked entry.\n");
  } else {
    password = await promptHidden("Enter staff password (masked): ");
    if (!password) {
      console.error("[Error] Password cannot be empty.");
      process.exit(1);
    }

    const confirm = await promptHidden("Confirm staff password: ");
    if (password !== confirm) {
      console.error("\n[Error] Passwords do not match. Provisioning aborted.");
      process.exit(1);
    }
  }

  if (password.length < 8) {
    console.error("[Error] Password must be at least 8 characters long.");
    process.exit(1);
  }

  // 6. Compute Cryptographic Password Hash (Identical to login verification)
  const passwordHash = hashPassword(password);

  // 7. Perform Safe Database Write
  console.log(`\n[Database] Connecting via ${process.env.DIRECT_URL ? "DIRECT_URL" : "DATABASE_URL"}...`);

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        role,
        passwordHash,
      },
    });

    console.log("=================================================================");
    console.log("  SUCCESS: Existing Staff Account Updated");
    console.log("=================================================================");
    console.log(`- User ID:      ${updated.id}`);
    console.log(`- Email:        ${updated.email}`);
    console.log(`- Name:         ${updated.name}`);
    console.log(`- Role:         ${updated.role}`);
    console.log("=================================================================");
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
      },
    });

    console.log("=================================================================");
    console.log("  SUCCESS: New Staff Account Provisioned");
    console.log("=================================================================");
    console.log(`- User ID:      ${created.id}`);
    console.log(`- Email:        ${created.email}`);
    console.log(`- Name:         ${created.name}`);
    console.log(`- Role:         ${created.role}`);
    console.log("=================================================================");
  }
}

// Only execute when run directly from CLI
if (require.main === module || process.argv[1]?.includes("provisionStaff")) {
  executeProvisioningFlow()
    .catch((err) => {
      console.error("[Staff Provisioning] Failed with error:", err.message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
