import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication Settings - Plane Web",
};

export default function AuthenticationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
