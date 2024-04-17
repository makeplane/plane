"use client";

import { ReactNode } from "react";
// layouts
import { AuthLayout } from "@/layouts";
// lib
import { AuthWrapper, InstanceWrapper } from "@/lib/wrappers";

interface ImageLayoutProps {
  children: ReactNode;
}

const ImageLayout = ({ children }: ImageLayoutProps) => (
  <InstanceWrapper>
    <AuthWrapper>
      <AuthLayout>{children}</AuthLayout>
    </AuthWrapper>
  </InstanceWrapper>
);

export default ImageLayout;
