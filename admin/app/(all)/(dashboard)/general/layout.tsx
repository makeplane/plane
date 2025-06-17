import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Settings - God Mode",
};

export default function GeneralLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
