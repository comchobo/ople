// TEMPORARY scaffold: delete or replace when implementing the product.
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "ople" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
