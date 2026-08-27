/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useRef } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
// icons
import { Info } from "lucide-react";
import { CheckIcon } from "@plane/propel/icons";
// ui
import { CircularProgress } from "@makeplane/propel/components/circular-progress";
// components
import { generateQueryParams } from "@plane/utils";
import { ListItem } from "@/components/core/list";
import { ModuleListItemAction, ModuleQuickActions } from "@/components/modules";
// helpers
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  moduleId: string;
};

export const ModuleListItem = observer(function ModuleListItem(props: Props) {
  const { moduleId } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
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

    const query = generateQueryParams(searchParams, ["peekModule"]);
    if (searchParams.has("peekModule") && searchParams.get("peekModule") === moduleId) {
      router.push(`${pathname}?${query}`);
    } else {
      router.push(`${pathname}?${query && `${query}&`}peekModule=${moduleId}`);
    }
  };

  const handleArchivedModuleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    openModuleOverview(e);
  };

  const handleItemClick = moduleDetails.archived_at ? handleArchivedModuleClick : undefined;

  return (
    <ListItem
      title={moduleDetails?.name ?? ""}
      itemLink={`/${workspaceSlug?.toString()}/projects/${moduleDetails.project_id}/modules/${moduleDetails.id}`}
      onItemClick={handleItemClick}
      prependTitleElement={
        <div className="relative size-[30px]">
          <div className="absolute inset-0 flex scale-150 items-center justify-center">
            <CircularProgress
              value={progress}
              size="md"
              variant={progress === 100 ? "success" : "brand"}
              aria-label="Module progress"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {completedModuleCheck ? (
              progress === 100 ? (
                <CheckIcon className="h-3 w-3 stroke-[2] text-accent-primary" />
              ) : (
                <span className="text-13 text-accent-primary">{`!`}</span>
              )
            ) : progress === 100 ? (
              <CheckIcon className="h-3 w-3 stroke-[2] text-accent-primary" />
            ) : (
              <span className="text-9 text-tertiary">{`${progress}%`}</span>
            )}
          </div>
        </div>
      }
      appendTitleElement={
        <button
          onClick={openModuleOverview}
          className={`z-[5] flex-shrink-0 ${isMobile ? "flex" : "hidden group-hover:flex"}`}
        >
          <Info className="h-4 w-4 text-placeholder" />
        </button>
      }
      actionableItems={<ModuleListItemAction moduleId={moduleId} moduleDetails={moduleDetails} parentRef={parentRef} />}
      quickActionElement={
        <div className="block md:hidden">
          <ModuleQuickActions
            parentRef={parentRef}
            moduleId={moduleId}
            projectId={projectId.toString()}
            workspaceSlug={workspaceSlug.toString()}
          />
        </div>
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
