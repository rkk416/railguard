"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Shield, UserCheck } from "lucide-react";

interface RoleSwitcherBarProps {
  currentUser: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export function RoleSwitcherBar({ currentUser }: RoleSwitcherBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (email: string) => {
    document.cookie = `railguard_session=${email}; path=/; max-age=86400; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div
      className="border-b px-4 py-2.5 flex flex-wrap items-center justify-between text-xs gap-3"
      style={{
        backgroundColor: "#1e2422",
        borderColor: "rgba(240, 237, 228, 0.12)",
        color: "var(--archive-paper)",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--jade)" }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "var(--jade)" }} />
        </span>
        <span className="font-mono uppercase tracking-wider font-semibold text-[10px]" style={{ color: "rgba(240, 237, 228, 0.6)" }}>
          Active Inspector:
        </span>
        <span className="font-semibold" style={{ color: "var(--archive-paper)" }}>
          {currentUser.name}
        </span>
        <span
          className="px-2 py-0.5 rounded font-mono font-bold text-[10px] border"
          style={{
            backgroundColor: isAdmin ? "rgba(178, 141, 85, 0.2)" : "rgba(82, 124, 114, 0.25)",
            color: isAdmin ? "var(--brass)" : "var(--jade)",
            borderColor: isAdmin ? "rgba(178, 141, 85, 0.5)" : "rgba(82, 124, 114, 0.5)",
          }}
        >
          {currentUser.role}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-[11px]" style={{ color: "rgba(240, 237, 228, 0.6)" }}>
          Role Session:
        </span>
        <div
          className="inline-flex rounded border p-0.5"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderColor: "rgba(240, 237, 228, 0.15)",
          }}
        >
          <button
            type="button"
            disabled={isPending || !isAdmin}
            onClick={() => handleSwitch("reviewer@railguard.test")}
            className="px-2.5 py-1 text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-default"
            style={{
              backgroundColor: !isAdmin ? "var(--jade)" : "transparent",
              color: !isAdmin ? "white" : "rgba(240, 237, 228, 0.6)",
              fontWeight: !isAdmin ? 600 : 400,
            }}
          >
            <UserCheck className="w-3 h-3" />
            Reviewer (Priya S.)
          </button>
          <button
            type="button"
            disabled={isPending || isAdmin}
            onClick={() => handleSwitch("admin@railguard.test")}
            className="px-2.5 py-1 text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-default"
            style={{
              backgroundColor: isAdmin ? "var(--brass)" : "transparent",
              color: isAdmin ? "white" : "rgba(240, 237, 228, 0.6)",
              fontWeight: isAdmin ? 600 : 400,
            }}
          >
            <Shield className="w-3 h-3" />
            Admin (Rajesh K.)
          </button>
        </div>
      </div>
    </div>
  );
}
