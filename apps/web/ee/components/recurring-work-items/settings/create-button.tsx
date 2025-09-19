import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
import { Button, TButtonSizes } from "@plane/ui";
import { getCreateUpdateRecurringWorkItemSettingsPath } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type TCreateRecurringWorkItemsButtonProps = {
  workspaceSlug: string;
  projectId: string;
  buttonI18nLabel?: string;
  buttonSize?: TButtonSizes;
};

export const CreateRecurringWorkItemsButton = observer((props: TCreateRecurringWorkItemsButtonProps) => {
  const { workspaceSlug, projectId, buttonI18nLabel, buttonSize } = props;
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const createPath = getCreateUpdateRecurringWorkItemSettingsPath({
    workspaceSlug,
    projectId,
  });
  const hasAdminPermission = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const getButtonLabel = useCallback(() => {
    if (!hasAdminPermission) return t("recurring_work_items.settings.create_button.no_permission");

    return t(buttonI18nLabel || "recurring_work_items.settings.create_button.label");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAdminPermission, buttonI18nLabel]);

  if (!hasAdminPermission) return null;
  return (
    <Button
      variant="primary"
      size={buttonSize}
      className="flex items-center justify-center gap-1.5"
      disabled={!hasAdminPermission}
      onClick={() => {
        router.push(createPath);
      }}
    >
      {getButtonLabel()}
    </Button>
  );
});
