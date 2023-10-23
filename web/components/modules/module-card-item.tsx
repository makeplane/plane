import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// components
import { CreateUpdateModuleModal, DeleteModuleModal } from "components/modules";
// ui
import { AssigneesList } from "components/ui";
import { CustomMenu, Tooltip } from "@plane/ui";
// icons
import { CalendarDays, LinkIcon, Pencil, Star, Target, Trash2 } from "lucide-react";
// helpers
import { copyUrlToClipboard, truncateText } from "helpers/string.helper";
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IModule } from "types";

type Props = {
  module: IModule;
};

export const ModuleCardItem: React.FC<Props> = observer((props) => {
  const { module } = props;

  const [editModuleModal, setEditModuleModal] = useState(false);
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { module: moduleStore } = useMobxStore();

  const completionPercentage = ((module.completed_issues + module.cancelled_issues) / module.total_issues) * 100;

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    moduleStore.addModuleToFavorites(workspaceSlug.toString(), projectId.toString(), module.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't add the module to favorites. Please try again.",
      });
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    moduleStore.removeModuleFromFavorites(workspaceSlug.toString(), projectId.toString(), module.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the module from favorites. Please try again.",
      });
    });
  };

  const handleCopyText = () => {
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/modules/${module.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Module link copied to clipboard.",
      });
    });
  };

  const endDate = new Date(module.target_date ?? "");
  const startDate = new Date(module.start_date ?? "");
  const lastUpdated = new Date(module.updated_at ?? "");

  return (
    <>
      {workspaceSlug && projectId && (
        <CreateUpdateModuleModal
          isOpen={editModuleModal}
          onClose={() => setEditModuleModal(false)}
          data={module}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <DeleteModuleModal data={module} isOpen={moduleDeleteModal} onClose={() => setModuleDeleteModal(false)} />
      <div className="flex flex-col divide-y divide-custom-border-200 overflow-hidden rounded-[10px] border border-custom-border-200 bg-custom-background-100 text-xs">
        <div className="p-4">
          <div className="flex w-full flex-col gap-5">
            <div className="flex items-start justify-between gap-2">
              <Tooltip tooltipContent={module.name} position="top-left">
                <Link href={`/${workspaceSlug}/projects/${module.project}/modules/${module.id}`}>
                  <a className="w-auto max-w-[calc(100%-9rem)]">
                    <h3 className="truncate break-words text-lg font-semibold text-custom-text-100">
                      {truncateText(module.name, 75)}
                    </h3>
                  </a>
                </Link>
              </Tooltip>

              <div className="flex items-center gap-1">
                <div className="mr-2 flex whitespace-nowrap rounded bg-custom-background-90 px-2.5 py-2 text-custom-text-200">
                  <span className="capitalize">{module?.status?.replace("-", " ")}</span>
                </div>
                {module.is_favorite ? (
                  <button type="button" onClick={handleRemoveFromFavorites}>
                    <Star className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAddToFavorites}>
                    <Star className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                  </button>
                )}

                <CustomMenu width="auto" verticalEllipsis placement="bottom-end">
                  <CustomMenu.MenuItem onClick={handleCopyText}>
                    <span className="flex items-center justify-start gap-2">
                      <LinkIcon className="h-3 w-3" strokeWidth={2} />
                      <span>Copy link</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={() => setEditModuleModal(true)}>
                    <span className="flex items-center justify-start gap-2">
                      <Pencil className="h-3 w-3" strokeWidth={2} />
                      <span>Edit module</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={() => setModuleDeleteModal(true)}>
                    <span className="flex items-center justify-start gap-2">
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                      <span>Delete module</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-custom-text-200">
              <div className="flex items-start gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>Start:</span>
                <span>{renderShortDateWithYearFormat(startDate, "Not set")}</span>
              </div>
              <div className="flex items-start gap-1">
                <Target className="h-4 w-4" />
                <span>End:</span>
                <span>{renderShortDateWithYearFormat(endDate, "Not set")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex h-20 flex-col items-end bg-custom-background-80">
          <div className="flex w-full items-center justify-between gap-2 justify-self-end p-4 text-custom-text-200">
            <span>Progress</span>
            <div className="bar relative h-1 w-full rounded bg-custom-background-90">
              <div
                className="absolute top-0 left-0 h-1 rounded bg-green-500 duration-300"
                style={{
                  width: `${isNaN(completionPercentage) ? 0 : completionPercentage.toFixed(0)}%`,
                }}
              />
            </div>
            <span>{isNaN(completionPercentage) ? 0 : completionPercentage.toFixed(0)}%</span>
          </div>
          <div className="item-center flex h-full w-full justify-between px-4 pb-4 text-custom-text-200">
            <p>
              Last updated:
              <span className="font-medium">{renderShortDateWithYearFormat(lastUpdated)}</span>
            </p>
            {module.members_detail.length > 0 && (
              <div className="flex items-center gap-1">
                <AssigneesList users={module.members_detail} length={4} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
