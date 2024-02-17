import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Check, Info, LinkIcon, Pencil, Star, Trash2, User2 } from "lucide-react";
// hooks
import { useModule, useUser, useEventTracker } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { CreateUpdateModuleModal, DeleteModuleModal } from "components/modules";
// ui
import { Avatar, AvatarGroup, CircularProgressIndicator, CustomMenu, Tooltip } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
import { renderFormattedDate } from "helpers/date-time.helper";
// constants
import { MODULE_STATUS } from "constants/module";
import { EUserProjectRoles } from "constants/project";
import { MODULE_FAVORITED, MODULE_UNFAVORITED } from "constants/event-tracker";

type Props = {
  moduleId: string;
};

export const ModuleListItem: React.FC<Props> = observer((props) => {
  const { moduleId } = props;
  // states
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getModuleById, addModuleToFavorites, removeModuleFromFavorites } = useModule();
  const { setTrackElement, captureEvent } = useEventTracker();
  // derived values
  const moduleDetails = getModuleById(moduleId);
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const handleAddToFavorites = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!workspaceSlug || !projectId) return;

    addModuleToFavorites(workspaceSlug.toString(), projectId.toString(), moduleId)
      .then(() => {
        captureEvent(MODULE_FAVORITED, {
          module_id: moduleId,
          element: "Grid layout",
          state: "SUCCESS",
        });
      })
      .catch(() => {
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

    removeModuleFromFavorites(workspaceSlug.toString(), projectId.toString(), moduleId)
      .then(() => {
        captureEvent(MODULE_UNFAVORITED, {
          module_id: moduleId,
          element: "Grid layout",
          state: "SUCCESS",
        });
      })
      .catch(() => {
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
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/modules/${moduleId}`).then(() => {
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
    setTrackElement("Modules page list layout");
    setEditModal(true);
  };

  const handleDeleteModule = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setTrackElement("Modules page list layout");
    setDeleteModal(true);
  };

  const openModuleOverview = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekModule: moduleId },
    });
  };

  if (!moduleDetails) return null;

  const completionPercentage =
    ((moduleDetails.completed_issues + moduleDetails.cancelled_issues) / moduleDetails.total_issues) * 100;

  const endDate = new Date(moduleDetails.target_date ?? "");
  const startDate = new Date(moduleDetails.start_date ?? "");

  const renderDate = moduleDetails.start_date || moduleDetails.target_date;

  // const areYearsEqual = startDate.getFullYear() === endDate.getFullYear();

  const moduleStatus = MODULE_STATUS.find((status) => status.value === moduleDetails.status);

  const progress = isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);

  const completedModuleCheck = moduleDetails.status === "completed";

  return (
    <>
      {workspaceSlug && projectId && (
        <CreateUpdateModuleModal
          isOpen={editModal}
          onClose={() => setEditModal(false)}
          data={moduleDetails}
          projectId={projectId.toString()}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <DeleteModuleModal data={moduleDetails} isOpen={deleteModal} onClose={() => setDeleteModal(false)} />
      <Link href={`/${workspaceSlug}/projects/${moduleDetails.project}/modules/${moduleDetails.id}`}>
        <div className="group flex w-full items-center justify-between gap-5 border-b border-custom-border-100 bg-custom-background-100 flex-col sm:flex-row px-5 py-6 text-sm hover:bg-custom-background-90">
          <div className="relative flex w-full items-center gap-3 justify-between overflow-hidden">
            <div className="relative w-full flex items-center gap-3 overflow-hidden">
              <div className="flex items-center gap-4 truncate">
                <span className="flex-shrink-0">
                  <CircularProgressIndicator size={38} percentage={progress}>
                    {completedModuleCheck ? (
                      progress === 100 ? (
                        <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
                      ) : (
                        <span className="text-sm text-custom-primary-100">{`!`}</span>
                      )
                    ) : progress === 100 ? (
                      <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
                    ) : (
                      <span className="text-xs text-custom-text-300">{`${progress}%`}</span>
                    )}
                  </CircularProgressIndicator>
                </span>
                <Tooltip tooltipContent={moduleDetails.name} position="top">
                  <span className="truncate text-base font-medium">{moduleDetails.name}</span>
                </Tooltip>
              </div>
              <button onClick={openModuleOverview} className="z-[5] hidden flex-shrink-0 group-hover:flex">
                <Info className="h-4 w-4 text-custom-text-400" />
              </button>
            </div>
            <div className="flex items-center justify-center flex-shrink-0">
              {moduleStatus && (
                <span
                  className="flex h-6 w-20 items-center justify-center rounded-sm text-center text-xs flex-shrink-0"
                  style={{
                    color: moduleStatus.color,
                    backgroundColor: `${moduleStatus.color}20`,
                  }}
                >
                  {moduleStatus.label}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full sm:w-auto relative overflow-hidden items-center gap-2.5 justify-between sm:justify-end sm:flex-shrink-0 ">
            <div className="text-xs text-custom-text-300">
              {renderDate && (
                <span className=" text-xs text-custom-text-300">
                  {renderFormattedDate(startDate) ?? "_ _"} - {renderFormattedDate(endDate) ?? "_ _"}
                </span>
              )}
            </div>

            <div className="flex-shrink-0 relative flex items-center gap-3">
              <Tooltip tooltipContent={`${moduleDetails.members_detail.length} Members`}>
                <div className="flex w-10 cursor-default items-center justify-center gap-1">
                  {moduleDetails.members_detail.length > 0 ? (
                    <AvatarGroup showTooltip={false}>
                      {moduleDetails.members_detail.map((member) => (
                        <Avatar key={member.id} name={member.display_name} src={member.avatar} />
                      ))}
                    </AvatarGroup>
                  ) : (
                    <span className="flex h-5 w-5 items-end justify-center rounded-full border border-dashed border-custom-text-400 bg-custom-background-80">
                      <User2 className="h-4 w-4 text-custom-text-400" />
                    </span>
                  )}
                </div>
              </Tooltip>

              {isEditingAllowed &&
                (moduleDetails.is_favorite ? (
                  <button type="button" onClick={handleRemoveFromFavorites} className="z-[1]">
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                  </button>
                ) : (
                  <button type="button" onClick={handleAddToFavorites} className="z-[1]">
                    <Star className="h-3.5 w-3.5 text-custom-text-300" />
                  </button>
                ))}

              <CustomMenu verticalEllipsis buttonClassName="z-[1]">
                {isEditingAllowed && (
                  <>
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
                  </>
                )}
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
      </Link>
    </>
  );
});
