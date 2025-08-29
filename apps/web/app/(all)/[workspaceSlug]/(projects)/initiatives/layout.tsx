"use client";

import { ReactNode, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { InitiativesUpgrade } from "@/plane-web/components/initiatives/upgrade";
// plane web hooks
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
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
  const shouldUpgrade = currentWorkspace && !isInitiativesFeatureEnabled && !loader;

  // store hooks
  const { initiative, initiativeFilters } = useInitiatives();

  useEffect(() => {
    if (workspaceSlug) {
      initiativeFilters.initInitiativeFilters(workspaceSlug.toString());
      initiative.fetchInitiatives(workspaceSlug.toString());
    }
  }, [workspaceSlug, initiative, initiativeFilters]);

  return (
    <WorkspaceAccessWrapper pageKey="initiatives">
      {shouldUpgrade ? (
        <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
          <InitiativesUpgrade workspaceSlug={workspaceSlug?.toString()} redirect />
        </div>
      ) : (
        <>
          <PageHead title={pageTitle} />
          {children}
        </>
      )}
    </WorkspaceAccessWrapper>
  );
});

export default InitiativesLayout;
