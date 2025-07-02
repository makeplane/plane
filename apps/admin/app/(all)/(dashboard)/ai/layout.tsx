import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artificial Intelligence Settings - God Mode",
};

export default function AILayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
