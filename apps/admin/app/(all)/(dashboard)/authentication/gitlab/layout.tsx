import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitLab Authentication - God Mode",
};

export default function GitlabAuthenticationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
