"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// constants
import {
  EPageAccess,
  EProjectFeatureKey,
  PROJECT_PAGE_TRACKER_EVENTS,
  PROJECT_TRACKER_ELEMENTS,
} from "@plane/constants";
// plane types
import { TPage } from "@plane/types";
// plane ui
import { Breadcrumbs, Button, Header, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { PanelLeft } from "lucide-react";

export const OverviewListHeader = observer(() => {
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const pageType = searchParams.get("type");
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const { canCurrentUserCreatePage } = usePageStore(EPageStoreType.PROJECT);
  const { overviewPeek, overviewSidebarPeek } = useAppTheme();

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs
            workspaceSlug={workspaceSlug?.toString() ?? ""}
            projectId={currentProjectDetails?.id?.toString() ?? ""}
            featureKey={EProjectFeatureKey.OVERVIEW}
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      {canCurrentUserCreatePage ? (
        <Header.RightItem>
          <button
            className="flex items-center justify-center size-6 rounded-md text-custom-text-400 hover:text-custom-primary-100 hover:bg-custom-background-90"
            onClick={() => {
              overviewSidebarPeek(!overviewPeek);
            }}
          >
            <PanelLeft className="size-4" />
          </button>
        </Header.RightItem>
      ) : (
        <></>
      )}
    </Header>
  );
});
