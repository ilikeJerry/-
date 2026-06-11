import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameN Insight | 글로벌 게임 운영 의사결정 플랫폼",
  description:
    "국가별 유저 반응·운영 리스크 변화를 감지하고 실행 우선순위를 제안하는 AI 기반 운영 인텔리전스 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
