import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/validation/rateLimiter";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid work email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

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

    // 3. User lookup
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 4. Constant-time / timing-safe credential verification
    const isValid = user ? verifyPassword(password, user.passwordHash) : false;

    if (!user || !isValid) {
      return NextResponse.json(
        { error: "Invalid staff credentials or account not recognized." },
        { status: 401 }
      );
    }

    // 5. Successful authentication response with secure HTTP-only cookie
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

    // Set HTTP-Only, Secure, SameSite=Lax session cookie
    response.cookies.set("railguard_session", user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
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
