"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { EProjectFeatureKey, EUserPermissions, EUserPermissionsLevel, CYCLE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { CyclesViewHeader } from "@/components/cycles";
// hooks
import { useCommandPalette, useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
// constants

export const CyclesListHeader: FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();

  // store hooks
  const { toggleCreateCycleModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails, loader } = useProject();
  const { t } = useTranslation();

  const canUserCreateCycle = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs
            workspaceSlug={workspaceSlug?.toString()}
            projectId={currentProjectDetails?.id ?? ""}
            featureKey={EProjectFeatureKey.CYCLES}
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      {canUserCreateCycle && currentProjectDetails ? (
        <Header.RightItem>
          <CyclesViewHeader projectId={currentProjectDetails.id} />
          <Button
            variant="primary"
            size="sm"
            data-ph-element={CYCLE_TRACKER_ELEMENTS.RIGHT_HEADER_ADD_BUTTON}
            onClick={() => {
              toggleCreateCycleModal(true);
            }}
          >
            <div className="sm:hidden block">{t("add")}</div>
            <div className="hidden sm:block">{t("project_cycles.add_cycle")}</div>
          </Button>
        </Header.RightItem>
      ) : (
        <></>
      )}
    </Header>
  );
});
