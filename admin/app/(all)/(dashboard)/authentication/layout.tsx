import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication Settings - Plane Web",
};

export default function AuthenticationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
