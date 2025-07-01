"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EProjectFeatureKey, EUserPermissions, EUserPermissionsLevel, MODULE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { ModuleViewHeader } from "@/components/modules";
// hooks
import { useCommandPalette, useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs";
// constants

export const ModulesListHeader: React.FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  // store hooks
  const { toggleCreateModuleModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  const { loader } = useProject();

  const { t } = useTranslation();

  // auth
  const canUserCreateModule = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
            <CommonProjectBreadcrumbs
              workspaceSlug={workspaceSlug?.toString() ?? ""}
              projectId={projectId?.toString() ?? ""}
              featureKey={EProjectFeatureKey.MODULES}
              isLast
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <ModuleViewHeader />
        {canUserCreateModule ? (
          <Button
            variant="primary"
            size="sm"
            data-ph-element={MODULE_TRACKER_ELEMENTS.RIGHT_HEADER_ADD_BUTTON}
            onClick={() => {
              toggleCreateModuleModal(true);
            }}
          >
            <div className="sm:hidden block">{t("add")}</div>
            <div className="hidden sm:block">{t("project_module.add_module")}</div>
          </Button>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
