import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Google Authentication - God Mode",
};

export default function GoogleAuthenticationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
