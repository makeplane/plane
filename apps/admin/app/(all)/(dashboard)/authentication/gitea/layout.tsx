import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gitea Authentication - God Mode",
};

export default function GiteaAuthenticationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
