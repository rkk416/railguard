import React, { Suspense } from "react";
import { Metadata } from "next";
import { InspectorsDeskIllustration } from "@/components/auth/InspectorsDeskIllustration";
import { StaffLoginForm } from "@/components/auth/StaffLoginForm";

export const metadata: Metadata = {
  title: "Staff Login — The Inspector's Desk | RailGuard",
  description: "Official railway quality inspection register and staff authentication console.",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 antialiased"
      style={{ backgroundColor: "var(--archive-paper)" }}
    >
      {/* ── LEFT SECTION: The Railway Inspection Register (Desktop: 7 cols) ── */}
      <section className="lg:col-span-7 flex flex-col justify-center min-h-[460px] lg:min-h-screen">
        <InspectorsDeskIllustration />
      </section>

      {/* ── RIGHT SECTION: Staff Authentication Desk (Desktop: 5 cols) ── */}
      <section className="lg:col-span-5 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[var(--paper-mid)] shadow-lg lg:shadow-none min-h-[500px]">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12 text-xs font-mono" style={{ color: "var(--ink-faint)" }}>
              Loading inspection desk...
            </div>
          }
        >
          <StaffLoginForm />
        </Suspense>
      </section>
    </div>
  );
}
