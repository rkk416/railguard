import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: "Staff session terminated successfully.",
      redirectTo: "/login",
    },
    { status: 200 }
  );

  // Expire the session cookie immediately
  response.cookies.set("railguard_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
