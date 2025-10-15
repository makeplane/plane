import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artificial Intelligence Settings - God Mode",
};

export default function AILayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
