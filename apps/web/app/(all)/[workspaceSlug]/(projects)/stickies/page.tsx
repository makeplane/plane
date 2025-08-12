"use client";

// components
import { PageHead } from "@/components/core/page-title";
import { StickiesInfinite } from "@/components/stickies";

export default function WorkspaceStickiesPage() {
  return (
    <>
      <PageHead title="Your stickies" />
      <div className="relative h-full w-full overflow-hidden overflow-y-auto">
        <StickiesInfinite />
      </div>
    </>
  );
}
