"use client";

// components
import { ContentWrapper } from "@/components/core";

export default function PiChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
