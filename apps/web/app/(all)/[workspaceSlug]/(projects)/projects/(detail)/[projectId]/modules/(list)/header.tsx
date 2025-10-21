"use client";

import { observer } from "mobx-react";
// plane imports
import { EProjectFeatureKey, EUserPermissions, EUserPermissionsLevel, MODULE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@plane/propel/button";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { ModuleViewHeader } from "@/components/modules";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
// constants

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ModulesListHeader: React.FC<Props> = observer(({ workspaceSlug, projectId }) => {
  // router
  const router = useAppRouter();
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
              workspaceSlug={workspaceSlug}
              projectId={projectId}
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
