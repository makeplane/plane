import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Settings - God Mode",
};

export default function GeneralLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
