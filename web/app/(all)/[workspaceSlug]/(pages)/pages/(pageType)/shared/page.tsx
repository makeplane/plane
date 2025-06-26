"use client";

import { useParams } from "next/navigation";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { WikiPagesListLayoutRoot } from "@/plane-web/components/pages";
// local components
import { SharedPagesFallback } from "./empty-shared-pages";

export default function SharedPagesList() {
  const { workspaceSlug } = useParams();

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag="SHARED_PAGES"
      fallback={<SharedPagesFallback />}
    >
      <WikiPagesListLayoutRoot pageType="shared" />
    </WithFeatureFlagHOC>
  );
}
