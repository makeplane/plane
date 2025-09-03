import { Metadata } from "next";

interface EmailLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: "Email Settings - God Mode",
};

export default function EmailLayout({ children }: EmailLayoutProps) {
  return <>{children}</>;
}
