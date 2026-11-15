"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      document.cookie = "railguard_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
      router.push("/login");
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="w-full mt-2 flex items-center justify-center gap-2 px-2.5 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer border"
      style={{
        backgroundColor: "rgba(198, 95, 72, 0.12)",
        borderColor: "rgba(198, 95, 72, 0.35)",
        color: "var(--signal-red)",
      }}
      title="Terminate staff session and return to login desk"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <LogOut className="w-3 h-3" />
      )}
      <span>Sign Out Desk</span>
    </button>
  );
}
