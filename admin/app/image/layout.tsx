import { ReactNode } from "react";
// layouts
import { AdminLayout } from "@/layouts/admin-layout";

interface ImageLayoutProps {
  children: ReactNode;
}

const ImageLayout = ({ children }: ImageLayoutProps) => <AdminLayout>{children}</AdminLayout>;

export default ImageLayout;
