import { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Settings - God Mode",
};

export default function GeneralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
