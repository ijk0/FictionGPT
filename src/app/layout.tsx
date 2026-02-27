import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FictionGPT - AI 小说创作平台",
  description: "基于 LLM 的智能小说创作平台，从灵感到成书",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased h-screen overflow-hidden">{children}</body>
    </html>
  );
}
