import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gitea Authentication - God Mode",
};

export default function GiteaAuthenticationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
