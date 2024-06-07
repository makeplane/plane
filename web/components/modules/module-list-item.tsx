import React, { useRef } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// icons
import { Check, Info } from "lucide-react";
// ui
import { CircularProgressIndicator } from "@plane/ui";
// components
import { ListItem } from "@/components/core/list";
import { ModuleListItemAction } from "@/components/modules";
// hooks
import { useModule } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
};

export const ModuleListItem: React.FC<Props> = observer((props) => {
  const { moduleId } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { getModuleById } = useModule();
  const { isMobile } = usePlatformOS();

  // derived values
  const moduleDetails = getModuleById(moduleId);

  if (!moduleDetails) return null;

  const completionPercentage =
    ((moduleDetails.completed_issues + moduleDetails.cancelled_issues) / moduleDetails.total_issues) * 100;

  const progress = isNaN(completionPercentage) ? 0 : Math.floor(completionPercentage);

  const completedModuleCheck = moduleDetails.status === "completed";

  // handlers
  const openModuleOverview = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const { query } = router;

    if (query.peekModule) {
      delete query.peekModule;
      router.push({
        pathname: router.pathname,
        query: { ...query },
      });
    } else {
      router.push({
        pathname: router.pathname,
        query: { ...query, peekModule: moduleId },
      });
    }
  };

  const handleArchivedModuleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    openModuleOverview(e);
  };

  const handleItemClick = moduleDetails.archived_at ? handleArchivedModuleClick : undefined;

  return (
    <ListItem
      title={moduleDetails?.name ?? ""}
      itemLink={`/${workspaceSlug}/projects/${moduleDetails.project_id}/modules/${moduleDetails.id}`}
      onItemClick={handleItemClick}
      prependTitleElement={
        <CircularProgressIndicator size={30} percentage={progress} strokeWidth={3}>
          {completedModuleCheck ? (
            progress === 100 ? (
              <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
            ) : (
              <span className="text-sm text-custom-primary-100">{`!`}</span>
            )
          ) : progress === 100 ? (
            <Check className="h-3 w-3 stroke-[2] text-custom-primary-100" />
          ) : (
            <span className="text-[9px] text-custom-text-300">{`${progress}%`}</span>
          )}
        </CircularProgressIndicator>
      }
      appendTitleElement={
        <button
          onClick={openModuleOverview}
          className={`z-[5] flex-shrink-0 ${isMobile ? "flex" : "hidden group-hover:flex"}`}
        >
          <Info className="h-4 w-4 text-custom-text-400" />
        </button>
      }
      actionableItems={<ModuleListItemAction moduleId={moduleId} moduleDetails={moduleDetails} parentRef={parentRef} />}
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
