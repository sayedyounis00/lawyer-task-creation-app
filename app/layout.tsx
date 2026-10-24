import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "منصة مهام مكتب المحاماة",
  description: "إدارة وتوزيع مهام مكتب المحاماة على فريق العمل للأجهزة المعتمدة.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F1115",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} dark h-full antialiased`} data-theme="dark" suppressHydrationWarning>
      <body className="min-h-full font-sans bg-[var(--bg-main)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
