"use client";

import { ReactNode } from "react";
// layouts
import { AdminLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface ImageLayoutProps {
  children: ReactNode;
}

const ImageLayout = ({ children }: ImageLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AdminLayout>{children}</AdminLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default ImageLayout;
