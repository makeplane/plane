import { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitLab Authentication - God Mode",
};

export default function GitlabAuthenticationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
