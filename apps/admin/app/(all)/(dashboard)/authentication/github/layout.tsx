import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitHub Authentication - God Mode",
};

export default function GitHubAuthenticationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
