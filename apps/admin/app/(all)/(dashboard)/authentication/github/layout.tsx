import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitHub Authentication - God Mode",
};

export default function GitHubAuthenticationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
