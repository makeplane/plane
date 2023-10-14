import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { mutate } from "swr";
// services
import { ModuleService } from "services/module.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { DeleteModuleModal } from "components/modules";
// ui
import { AssigneesList, CustomMenu } from "components/ui";
import { Tooltip } from "@plane/ui";
// icons
import { CalendarDaysIcon, LinkIcon, PencilIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
import { TargetIcon } from "components/icons";

// helpers
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IUser, IModule } from "types";
// fetch-key
import { MODULE_LIST } from "constants/fetch-keys";

type Props = {
  module: IModule;
  handleEditModule: () => void;
  user: IUser | undefined;
};

const moduleService = new ModuleService();

export const SingleModuleCard: React.FC<Props> = ({ module, handleEditModule, user }) => {
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
  const lastUpdated = new Date(module.updated_at ?? "");

  return (
    <>
      <DeleteModuleModal isOpen={moduleDeleteModal} setIsOpen={setModuleDeleteModal} data={module} user={user} />
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
                    <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAddToFavorites}>
                    <StarIcon className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                  </button>
                )}

                <CustomMenu width="auto" verticalEllipsis>
                  <CustomMenu.MenuItem onClick={handleEditModule}>
                    <span className="flex items-center justify-start gap-2">
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit module</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleDeleteModule}>
                    <span className="flex items-center justify-start gap-2">
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete module</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleCopyText}>
                    <span className="flex items-center justify-start gap-2">
                      <LinkIcon className="h-4 w-4" />
                      <span>Copy module link</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-custom-text-200">
              <div className="flex items-start gap-1">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>Start:</span>
                <span>{renderShortDateWithYearFormat(startDate, "Not set")}</span>
              </div>
              <div className="flex items-start gap-1">
                <TargetIcon className="h-4 w-4" />
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
};
