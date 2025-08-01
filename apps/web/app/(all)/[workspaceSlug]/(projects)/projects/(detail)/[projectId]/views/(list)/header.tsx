"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { EProjectFeatureKey, PROJECT_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { ViewListHeader } from "@/components/views";
// hooks
import { useCommandPalette, useProject } from "@/hooks/store";
// plane web
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs";

export const ProjectViewsHeader = observer(() => {
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  // store hooks
  const { toggleCreateViewModal } = useCommandPalette();
  const { loader } = useProject();

  return (
    <>
      <Header>
        <Header.LeftItem>
          <Breadcrumbs isLoading={loader === "init-loader"}>
            <CommonProjectBreadcrumbs
              workspaceSlug={workspaceSlug?.toString() ?? ""}
              projectId={projectId?.toString() ?? ""}
              featureKey={EProjectFeatureKey.VIEWS}
              isLast
            />
          </Breadcrumbs>
        </Header.LeftItem>
        <Header.RightItem>
          <ViewListHeader />
          <div>
            <Button
              data-ph-element={PROJECT_VIEW_TRACKER_ELEMENTS.RIGHT_HEADER_ADD_BUTTON}
              variant="primary"
              size="sm"
              onClick={() => toggleCreateViewModal(true)}
            >
              Add view
            </Button>
          </div>
        </Header.RightItem>
      </Header>
    </>
  );
});
