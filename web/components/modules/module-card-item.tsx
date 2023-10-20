import React, { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
// services
import { ModuleService } from "services/module.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { DeleteModuleModal } from "components/modules";
// ui
import { AssigneesList } from "components/ui";
import { CustomMenu, LayersIcon, Tooltip } from "@plane/ui";
// icons
import { Info, LinkIcon, Pencil, Star, Trash2 } from "lucide-react";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { renderShortDate, renderShortMonthDate } from "helpers/date-time.helper";
// types
import { IUser, IModule } from "types";
// fetch-key
// constants
import { MODULE_LIST } from "constants/fetch-keys";
import { MODULE_STATUS } from "constants/module";
import Link from "next/link";

type Props = {
  module: IModule;
  handleEditModule: () => void;
  user: IUser | undefined;
};

const moduleService = new ModuleService();

export const ModuleCardItem: React.FC<Props> = ({ module, handleEditModule, user }) => {
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const completionPercentage = ((module.completed_issues + module.cancelled_issues) / module.total_issues) * 100;

  const handleDeleteModule = () => {
    if (!module) return;

    setModuleDeleteModal(true);
  };

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId || !module) return;

    mutate<IModule[]>(
      MODULE_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((m) => ({
          ...m,
          is_favorite: m.id === module.id ? true : m.is_favorite,
        })),
      false
    );

    moduleService
      .addModuleToFavorites(workspaceSlug as string, projectId as string, {
        module: module.id,
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't add the module to favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !projectId || !module) return;

    mutate<IModule[]>(
      MODULE_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((m) => ({
          ...m,
          is_favorite: m.id === module.id ? false : m.is_favorite,
        })),
      false
    );

    moduleService.removeModuleFromFavorites(workspaceSlug as string, projectId as string, module.id).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Couldn't remove the module from favorites. Please try again.",
      });
    });
  };

  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/modules/${module.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Module link copied to clipboard.",
      });
    });
  };

  const endDate = new Date(module.target_date ?? "");
  const startDate = new Date(module.start_date ?? "");

  const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const moduleStatus = MODULE_STATUS.find((status) => status.value === module.status);

  return (
    <>
      <DeleteModuleModal isOpen={moduleDeleteModal} setIsOpen={setModuleDeleteModal} data={module} user={user} />
      <Link href={`/${workspaceSlug}/projects/${module.project}/modules/${module.id}`}>
        <a className="flex flex-col justify-between p-4 h-44 w-96 text-sm rounded bg-custom-background-100 border border-custom-border-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-base font-medium">{module.name}</span>
              <div className="flex items-center gap-2">
                {moduleStatus && (
                  <span className={`rounded-sm text-xs px-4 py-1 ${moduleStatus.textColor} ${moduleStatus.bgColor}`}>
                    {moduleStatus.label}
                  </span>
                )}

                <Info className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-custom-text-200">
                <LayersIcon className="h-4 w-4" />
                <span>{`${module.completed_issues + module.cancelled_issues}/${module.total_issues} Issues`}</span>
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
              <span className="text-custom-text-200 spacing tracking-tight">
                {areYearsEqual ? renderShortDate(startDate, "_ _") : renderShortMonthDate(startDate, "_ _")} -{" "}
                {areYearsEqual ? renderShortDate(endDate, "_ _") : renderShortMonthDate(endDate, "_ _")}
              </span>
              <div className="flex items-center gap-1.5 z-10">
                {module.is_favorite ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleRemoveFromFavorites();
                    }}
                  >
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleAddToFavorites();
                    }}
                  >
                    <Star className="h-3 w-3 text-custom-text-200" />
                  </button>
                )}
                <CustomMenu width="auto" ellipsis>
                  <CustomMenu.MenuItem onClick={handleEditModule}>
                    <span className="flex items-center justify-start gap-2">
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit module</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleDeleteModule}>
                    <span className="flex items-center justify-start gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete module</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleCopyText}>
                    <span className="flex items-center justify-start gap-2">
                      <LinkIcon className="h-3.5 w-3.5" />
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
};
