import { ReactNode } from "react";
import { Metadata } from "next";
import { AdminLayout } from "@/layouts/admin-layout";

interface ImageLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "Images Settings - God Mode",
};

const ImageLayout = ({ children }: ImageLayoutProps) => <AdminLayout>{children}</AdminLayout>;

export default ImageLayout;
