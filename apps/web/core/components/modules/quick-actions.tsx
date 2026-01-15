import { useState } from "react";
import { observer } from "mobx-react";
import { MoreHorizontal } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
// components
import { useModuleMenuItems } from "@/components/common/quick-actions-helper";
import { ArchiveModuleModal, CreateUpdateModuleModal, DeleteModuleModal } from "@/components/modules";
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  parentRef: React.RefObject<HTMLDivElement>;
  moduleId: string;
  projectId: string;
  workspaceSlug: string;
  customClassName?: string;
};

export const ModuleQuickActions = observer(function ModuleQuickActions(props: Props) {
  const { parentRef, moduleId, projectId, workspaceSlug, customClassName } = props;
  // router
  const router = useAppRouter();
  // states
  const [editModal, setEditModal] = useState(false);
  const [archiveModuleModal, setArchiveModuleModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const { getModuleById, restoreModule } = useModule();

  const { t } = useTranslation();
  // derived values
  const moduleDetails = getModuleById(moduleId);
  // auth
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const moduleLink = `${workspaceSlug}/projects/${projectId}/modules/${moduleId}`;
  const handleCopyText = () =>
    copyUrlToClipboard(moduleLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Module link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`/${moduleLink}`, "_blank");

  const handleRestoreModule = async () => {
    try {
      await restoreModule(workspaceSlug, projectId, moduleId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Restore success",
        message: "Your module can be found in project modules.",
      });
      router.push(`/${workspaceSlug}/projects/${projectId}/archives/modules`);
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Module could not be restored. Please try again.",
      });
    }
  };

  // Use unified menu hook from plane-web (resolves to CE or EE)
  const menuResult = useModuleMenuItems({
    moduleDetails: moduleDetails ?? undefined,
    workspaceSlug,
    projectId,
    moduleId,
    isEditingAllowed,
    handleEdit: () => setEditModal(true),
    handleArchive: () => setArchiveModuleModal(true),
    handleRestore: handleRestoreModule,
    handleDelete: () => setDeleteModal(true),
    handleCopyLink: handleCopyText,
    handleOpenInNewTab,
  });

  // Handle both CE (array) and EE (object) return types
  const MENU_ITEMS: TContextMenuItem[] = Array.isArray(menuResult) ? menuResult : menuResult.items;
  const additionalModals = Array.isArray(menuResult) ? null : menuResult.modals;

  const CONTEXT_MENU_ITEMS = MENU_ITEMS.map(function CONTEXT_MENU_ITEMS(item) {
    return {
      ...item,

      onClick: () => {
        item.action();
      },
    };
  });

  return (
    <>
      {moduleDetails && (
        <div className="fixed">
          <CreateUpdateModuleModal
            isOpen={editModal}
            onClose={() => setEditModal(false)}
            data={moduleDetails}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
          <ArchiveModuleModal
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            moduleId={moduleId}
            isOpen={archiveModuleModal}
            handleClose={() => setArchiveModuleModal(false)}
          />
          <DeleteModuleModal data={moduleDetails} isOpen={deleteModal} onClose={() => setDeleteModal(false)} />
          {additionalModals}
        </div>
      )}
      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <CustomMenu
        customButton={<IconButton variant="tertiary" size="lg" icon={MoreHorizontal} />}
        placement="bottom-end"
        closeOnSelect
        buttonClassName={customClassName}
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-placeholder": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3 flex-shrink-0", item.iconClassName)} />}
              <div>
                <h5>{item.title}</h5>
                {item.description && (
                  <p
                    className={cn("text-tertiary whitespace-pre-line", {
                      "text-placeholder": item.disabled,
                    })}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
