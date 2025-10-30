import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Google Authentication - God Mode",
};

export default function GoogleAuthenticationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
