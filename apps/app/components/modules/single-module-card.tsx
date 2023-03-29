import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import modulesService from "services/modules.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { DeleteModuleModal } from "components/modules";
// ui
import { AssigneesList, Avatar, CustomMenu, Tooltip } from "components/ui";
// icons
import {
  DocumentDuplicateIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CalendarMonthIcon, TargetIcon } from "components/icons";

// helpers
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IModule } from "types";
// fetch-key
import { MODULE_LIST } from "constants/fetch-keys";

type Props = {
  module: IModule;
  handleEditModule: () => void;
};

export const SingleModuleCard: React.FC<Props> = ({ module, handleEditModule }) => {
  const [moduleDeleteModal, setModuleDeleteModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const completionPercentage = (module.completed_issues / module.total_issues) * 100;

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

    modulesService
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

    modulesService
      .removeModuleFromFavorites(workspaceSlug as string, projectId as string, module.id)
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the module from favorites. Please try again.",
        });
      });
  };

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/modules/${module.id}`
    ).then(() => {
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
      <DeleteModuleModal
        isOpen={moduleDeleteModal}
        setIsOpen={setModuleDeleteModal}
        data={module}
      />
      <div className="flex flex-col overflow-hidden rounded-[10px] divide-y border bg-white text-xs">
        <div className="p-4">
          <div className="flex w-full flex-col gap-5">
            <div className="flex items-start justify-between gap-2">
              <Tooltip tooltipContent={module.name} position="top-left">
                <Link href={`/${workspaceSlug}/projects/${module.project}/modules/${module.id}`}>
                  <a className="w-auto max-w-[calc(100%-9rem)]">
                    <h3 className="break-all text-lg truncate font-semibold text-black">
                      {truncateText(module.name, 75)}
                    </h3>
                  </a>
                </Link>
              </Tooltip>

              <div className="flex items-center gap-1">
                <div className="mr-2 rounded flex bg-gray-100 px-2.5 py-2 whitespace-nowrap">
                  <span className="capitalize">{module?.status?.replace("-", " ")}</span>
                </div>
                {module.is_favorite ? (
                  <button type="button" onClick={handleRemoveFromFavorites}>
                    <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAddToFavorites}>
                    <StarIcon className="h-4 w-4 " color="#858E96" />
                  </button>
                )}

                <CustomMenu width="auto" verticalEllipsis>
                  <CustomMenu.MenuItem onClick={handleEditModule}>
                    <span className="flex items-center justify-start gap-2 text-gray-800">
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit Module</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleDeleteModule}>
                    <span className="flex items-center justify-start gap-2 text-gray-800">
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete Module</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleCopyText}>
                    <span className="flex items-center justify-start gap-2 text-gray-800">
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      <span>Copy Module Link</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-1">
                <CalendarMonthIcon className="h-4 w-4 text-gray-900" />
                <span className="text-gray-400">Start:</span>
                <span>{renderShortDateWithYearFormat(startDate)}</span>
              </div>
              <div className="flex items-start gap-1">
                <TargetIcon className="h-4 w-4 text-gray-900" />
                <span className="text-gray-400">End:</span>
                <span>{renderShortDateWithYearFormat(endDate)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col h-full items-end">
          <div className="flex w-full items-center justify-between gap-2 justify-self-end bg-gray-100 p-4">
            <span>Progress</span>
            <div className="bar relative h-1 w-full rounded bg-gray-300">
              <div
                className="absolute top-0 left-0 h-1 rounded bg-green-500 duration-300"
                style={{
                  width: `${isNaN(completionPercentage) ? 0 : completionPercentage.toFixed(0)}%`,
                }}
              />
            </div>
            <span>{isNaN(completionPercentage) ? 0 : completionPercentage.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between w-full px-4 pb-4 bg-gray-100 item-center">
            <p className="text-[#858E96]">
              Last updated:
              <span className="text-black font-medium">
                {renderShortDateWithYearFormat(lastUpdated)}
              </span>
            </p>
            <div className="flex items-center gap-1">
              <AssigneesList users={module.members_detail} length={4} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
