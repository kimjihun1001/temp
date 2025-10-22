import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "비트코인 거래소 보유량 분석",
  description: "실시간 거래소 보유량과 가격 데이터를 확인하세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
