"use client";

import { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { PageHead } from "@/components/core";
import { useWorkspace } from "@/hooks/store";
// plane web components
import { InitiativesUpgrade } from "@/plane-web/components/initiatives/upgrade";
// plane web hooks
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const InitiativesLayout = observer(({ children }: { children: ReactNode }) => {
  // router
  const { workspaceSlug } = useParams();
  // store
  const { currentWorkspace } = useWorkspace();
  // plane web stores
  const { isWorkspaceFeatureEnabled, loader } = useWorkspaceFeatures();
  const isInitiativesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED);

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Initiatives` : undefined;

  if (currentWorkspace && !isInitiativesFeatureEnabled && !loader)
    return (
      <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
        <InitiativesUpgrade workspaceSlug={workspaceSlug?.toString()} redirect />
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      {children}
    </>
  );
});

export default InitiativesLayout;
