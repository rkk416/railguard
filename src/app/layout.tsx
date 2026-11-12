import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RailGuard — The Living Inspection Register",
  description:
    "Railway food quality audit and passenger feedback platform. Scan packaging, report concerns, track investigations.",
  keywords: [
    "railway food safety",
    "IRCTC audit",
    "catering inspection",
    "passenger feedback",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Preconnect for Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
