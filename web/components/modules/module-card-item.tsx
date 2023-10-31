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
import { CustomMenu, LayersIcon, Tooltip } from "@plane/ui";
// icons
import { Info, LinkIcon, Pencil, Star, Trash2 } from "lucide-react";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
import { renderShortDate, renderShortMonthDate } from "helpers/date-time.helper";
// types
import { IModule } from "types";
// constants
import { MODULE_STATUS } from "constants/module";

type Props = {
  module: IModule;
};

export const ModuleCardItem: React.FC<Props> = observer((props) => {
  const { module } = props;

  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const { module: moduleStore } = useMobxStore();

  const completionPercentage = (module.completed_issues / module.total_issues) * 100;

  const endDate = new Date(module.target_date ?? "");
  const startDate = new Date(module.start_date ?? "");

  const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const moduleStatus = MODULE_STATUS.find((status) => status.value === module.status);

  const issueCount =
    module.completed_issues && module.total_issues
      ? module.total_issues === 0
        ? "0 Issue"
        : module.total_issues === module.completed_issues
        ? module.total_issues > 1
          ? `${module.total_issues} Issues`
          : `${module.total_issues} Issue`
        : `${module.completed_issues}/${module.total_issues} Issues`
      : "0 Issue";

  const handleAddToFavorites = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    moduleStore.addModuleToFavorites(workspaceSlug.toString(), projectId.toString(), module.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't add the module to favorites. Please try again.",
      });
    });
  };

  const handleRemoveFromFavorites = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    moduleStore.removeModuleFromFavorites(workspaceSlug.toString(), projectId.toString(), module.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the module from favorites. Please try again.",
      });
    });
  };

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/modules/${module.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Module link copied to clipboard.",
      });
    });
  };

  const handleEditModule = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditModal(true);
  };

  const handleDeleteModule = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal(true);
  };

  const openModuleOverview = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekModule: module.id },
    });
  };

  return (
    <>
      {workspaceSlug && projectId && (
        <CreateUpdateModuleModal
          isOpen={editModal}
          onClose={() => setEditModal(false)}
          data={module}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <DeleteModuleModal data={module} isOpen={deleteModal} onClose={() => setDeleteModal(false)} />
      <Link href={`/${workspaceSlug}/projects/${module.project}/modules/${module.id}`}>
        <a className="flex flex-col justify-between p-4 h-44 w-full min-w-[250px]  text-sm rounded bg-custom-background-100 border border-custom-border-100 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Tooltip tooltipContent={module.name} position="top">
                <span className="text-base font-medium truncate">{module.name}</span>
              </Tooltip>
              <div className="flex items-center gap-2">
                {moduleStatus && (
                  <span
                    className={`flex items-center justify-center text-xs h-6 w-20 rounded-sm ${moduleStatus.textColor} ${moduleStatus.bgColor}`}
                  >
                    {moduleStatus.label}
                  </span>
                )}
                <button onClick={openModuleOverview}>
                  <Info className="h-4 w-4 text-custom-text-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-custom-text-200">
                <LayersIcon className="h-4 w-4 text-custom-text-300" />
                <span className="text-xs text-custom-text-300">{issueCount}</span>
              </div>
              {module.members_detail.length > 0 && (
                <Tooltip tooltipContent={`${module.members_detail.length} Members`}>
                  <div className="flex items-center gap-1 cursor-default">
                    <AssigneesList users={module.members_detail} length={3} />
                  </div>
                </Tooltip>
              )}
            </div>

            <Tooltip
              tooltipContent={isNaN(completionPercentage) ? "0" : `${completionPercentage.toFixed(0)}%`}
              position="top-left"
            >
              <div className="flex items-center w-full">
                <div
                  className="bar relative h-1.5 w-full rounded bg-custom-background-90"
                  style={{
                    boxShadow: "1px 1px 4px 0px rgba(161, 169, 191, 0.35) inset",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 h-1.5 rounded bg-blue-600 duration-300"
                    style={{
                      width: `${isNaN(completionPercentage) ? 0 : completionPercentage.toFixed(0)}%`,
                    }}
                  />
                </div>
              </div>
            </Tooltip>

            <div className="flex items-center justify-between">
              <span className="text-xs text-custom-text-300">
                {areYearsEqual ? renderShortDate(startDate, "_ _") : renderShortMonthDate(startDate, "_ _")} -{" "}
                {areYearsEqual ? renderShortDate(endDate, "_ _") : renderShortMonthDate(endDate, "_ _")}
              </span>
              <div className="flex items-center gap-1.5 z-10">
                {module.is_favorite ? (
                  <button type="button" onClick={handleRemoveFromFavorites}>
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAddToFavorites}>
                    <Star className="h-3.5 w-3.5 text-custom-text-200" />
                  </button>
                )}
                <CustomMenu width="auto" ellipsis className="z-10">
                  <CustomMenu.MenuItem onClick={handleEditModule}>
                    <span className="flex items-center justify-start gap-2">
                      <Pencil className="h-3 w-3" />
                      <span>Edit module</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleDeleteModule}>
                    <span className="flex items-center justify-start gap-2">
                      <Trash2 className="h-3 w-3" />
                      <span>Delete module</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleCopyText}>
                    <span className="flex items-center justify-start gap-2">
                      <LinkIcon className="h-3 w-3" />
                      <span>Copy module link</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </>
  );
});
