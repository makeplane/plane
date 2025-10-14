import type { ReactNode } from "react";
import type { Metadata } from "next";

interface ImageLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "Images Settings - God Mode",
};

export default function ImageLayout({ children }: ImageLayoutProps) {
  return <>{children}</>;
}
