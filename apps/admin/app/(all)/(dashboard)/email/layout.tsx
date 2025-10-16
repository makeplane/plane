import type { ReactNode } from "react";
import type { Metadata } from "next";

interface EmailLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "Email Settings - God Mode",
};

export default function EmailLayout({ children }: EmailLayoutProps) {
  return <>{children}</>;
}
