"use client";

import { LogoSpinner } from "@/components/common";

export default function InboxLoadingPage() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <LogoSpinner />
    </div>
  );
}
