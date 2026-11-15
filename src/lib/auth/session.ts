import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";
import { verifySessionToken } from "./sessionToken";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SessionResult {
  authenticated: boolean;
  user: AuthenticatedUser | null;
  error?: string;
}

/**
 * Server-enforced session resolution.
 * Inspects signed cookies and authorization headers, resolving the actor against the database.
 * Client claims are NEVER trusted blindly without DB validation.
 */
export async function resolveSession(req: NextRequest): Promise<SessionResult> {
  try {
    // 1. Check for Admin Secret bypass header (for administrative scripts/tasks)
    const adminKey = req.headers.get("x-admin-key");
    const configuredSecret = process.env.DEMO_RESET_ADMIN_SECRET;
    if (adminKey && configuredSecret && adminKey === configuredSecret) {
      const adminUser = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
      });
      if (adminUser) {
        return {
          authenticated: true,
          user: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
          },
        };
      }
    }

    // 2. Check signed session cookie
    const sessionCookie = req.cookies.get("railguard_session")?.value;
    if (!sessionCookie) {
      return {
        authenticated: false,
        user: null,
        error: "No active session or credentials provided",
      };
    }

    // 3. Cryptographically verify token signature and expiry
    const tokenPayload = verifySessionToken(sessionCookie);
    if (!tokenPayload) {
      return {
        authenticated: false,
        user: null,
        error: "Invalid or expired session token",
      };
    }

    // 4. Resolve user from database to ensure valid status and server-enforced role
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
    });

    if (!user) {
      return {
        authenticated: false,
        user: null,
        error: "User account not recognized or revoked",
      };
    }

    // Ensure database role strictly matches token claim
    if (user.role !== tokenPayload.role) {
      return {
        authenticated: false,
        user: null,
        error: "User role mismatch or permissions altered",
      };
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Session resolution failure";
    return {
      authenticated: false,
      user: null,
      error: message,
    };
  }
}

/**
 * Server-enforced RBAC guard: Requires ADMIN role.
 */
export async function requireAdmin(req: NextRequest): Promise<{
  authorized: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}> {
  const session = await resolveSession(req);
  if (!session.authenticated || !session.user) {
    return {
      authorized: false,
      error: "Authentication required",
      statusCode: 401,
    };
  }

  if (session.user.role !== UserRole.ADMIN) {
    return {
      authorized: false,
      error: "Forbidden: Administrator role required for this operation",
      statusCode: 403,
    };
  }

  return { authorized: true, user: session.user };
}

/**
 * Server-enforced RBAC guard: Requires QUALITY_REVIEWER or ADMIN role.
 */
export async function requireReviewer(req: NextRequest): Promise<{
  authorized: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}> {
  const session = await resolveSession(req);
  if (!session.authenticated || !session.user) {
    return {
      authorized: false,
      error: "Authentication required",
      statusCode: 401,
    };
  }

  if (
    session.user.role !== UserRole.QUALITY_REVIEWER &&
    session.user.role !== UserRole.ADMIN
  ) {
    return {
      authorized: false,
      error: "Forbidden: Quality Reviewer role required",
      statusCode: 403,
    };
  }

  return { authorized: true, user: session.user };
}
