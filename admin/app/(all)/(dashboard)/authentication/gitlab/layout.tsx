import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitLab Authentication - God Mode",
};

export default function GitlabAuthenticationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
