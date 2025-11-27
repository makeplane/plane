import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, MODULE_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@plane/propel/button";
import { ModuleIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { ModuleViewHeader } from "@/components/modules";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

export const ModulesListHeader = observer(function ModulesListHeader() {
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
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label="Modules"
                  href={`/${workspaceSlug}/projects/${projectId}/modules/`}
                  icon={<ModuleIcon className="h-4 w-4 text-custom-text-300" />}
                  isLast
                />
              }
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
