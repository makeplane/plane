import { ReactNode } from "react";
import { Metadata } from "next";

interface ImageLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "Images Settings - God Mode",
};

export default function ImageLayout({ children }: ImageLayoutProps) {
  return <>{children}</>;
}
