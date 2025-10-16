import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitHub Authentication - God Mode",
};

export default function GitHubAuthenticationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
