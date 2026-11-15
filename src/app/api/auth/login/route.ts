import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/sessionToken";
import { checkRateLimit } from "@/lib/validation/rateLimiter";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid work email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// Generic authentication error message to prevent account enumeration
const GENERIC_AUTH_ERROR = "Invalid staff credentials or account not recognized.";

// Dummy hash for constant-time comparison when user is not found
const DUMMY_SCRYPT_HASH =
  "scrypt$16384,8,1$00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export async function POST(req: NextRequest) {
  try {
    // 1. IP-based sliding window rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const clientIp = ip.split(",")[0].trim();
    const rateCheck = checkRateLimit(`login_${clientIp}`, 10, 15 * 60 * 1000); // 10 attempts per 15 mins

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Access temporarily restricted. Try again in ${rateCheck.resetInSeconds} seconds.`,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    // 2. Validate payload
    const body = await req.json().catch(() => ({}));
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    // 3. User lookup through Prisma
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 4. Constant-time / timing-safe credential verification
    // Even if user does not exist, compute verifyPassword to prevent timing-based user enumeration
    const targetHash = user?.passwordHash || DUMMY_SCRYPT_HASH;
    const isValid = verifyPassword(password, targetHash);

    if (!user || !isValid) {
      return NextResponse.json(
        { error: GENERIC_AUTH_ERROR },
        { status: 401 }
      );
    }

    // 5. Generate tamper-proof signed session token
    const token = createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 6. Build response with secure HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        redirectTo: "/dashboard",
      },
      { status: 200 }
    );

    response.cookies.set("railguard_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60, // 12 hours
    });

    return response;
  } catch (error: unknown) {
    console.error("[POST /api/auth/login] Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error during staff authentication" },
      { status: 500 }
    );
  }
}
