import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveSession } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/sessionToken";

export async function POST(req: NextRequest) {
  try {
    const session = await resolveSession(req);
    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        { error: "Authentication required to update credentials." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Retrieve user record with current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Staff account not found." },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password verification failed. Please check your credentials." },
        { status: 400 }
      );
    }

    // Hash new password using scrypt
    const newPasswordHash = hashPassword(newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Create refreshed session token
    const token = createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Password updated successfully.",
      },
      { status: 200 }
    );

    // Refresh session cookie
    response.cookies.set("railguard_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    console.error("[POST /api/auth/change-password] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating the password." },
      { status: 500 }
    );
  }
}
