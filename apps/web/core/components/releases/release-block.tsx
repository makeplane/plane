/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useNavigate } from "react-router";
import { mutate } from "swr";
import { CircularProgressIndicator } from "@plane/propel/progress/circular-progress-indicator";
import { TrashIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { Release } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { WORKSPACE_RELEASES } from "@/constants/fetch-keys";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useReleases } from "@/hooks/store/use-releases";
import { DeleteReleaseModal } from "./delete-release-modal";
import { ReleaseBlockProperties } from "./release-block-properties";

type Props = {
  release: Release;
};

export const ReleaseBlock = observer(function ReleaseBlock(props: Props) {
  const { release } = props;
  const { workspaceSlug } = useParams();
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const { release: releaseStore } = useReleases();
  const slug = workspaceSlug?.toString() ?? "";

  const totalWorkItems = release.work_item_ids?.length ?? 0;
  const completedCount = release.completed_work_item_count ?? 0;
  const completionPercentage = totalWorkItems > 0 ? Math.round((completedCount / totalWorkItems) * 100) : 0;

  const handleRowClick = () => {
    if (workspaceSlug) navigate(`/${workspaceSlug}/releases/${release.id}`);
  };

  const handleDeleteConfirm = async () => {
    try {
      await releaseStore.deleteRelease(slug, release.id);
      await mutate(
        WORKSPACE_RELEASES(slug),
        (current: Release[] | undefined) => (current ?? []).filter((r) => r.id !== release.id),
        { revalidate: false }
      );
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error.something_went_wrong") });
    }
  };

  return (
    <>
      <button
        type="button"
        className={cn(
          "group/release-block w-full relative flex cursor-pointer flex-col items-center justify-between gap-3 border-0 border-b border-subtle bg-layer-transparent p-0 text-left text-13 outline-none transition-colors hover:bg-layer-transparent-hover focus-visible:ring-2 focus-visible:ring-accent-primary",
          {
            "lg:flex-row lg:gap-5 lg:py-0": !isSidebarCollapsed,
            "xl:flex-row xl:gap-5 xl:py-0": isSidebarCollapsed,
          }
        )}
        onClick={handleRowClick}
      >
        <div className="relative flex w-full items-center justify-between gap-1 truncate flex-wrap md:flex-nowrap shrink-0 min-w-0 px-6 py-4">
          <div className="flex flex-1 items-center gap-4 truncate min-w-0 -ml-2 pl-2">
            <Tooltip tooltipContent={release.name} position="top" isMobile={isMobile}>
              <span className="truncate text-13 font-medium text-secondary group-hover/release-block:text-primary block min-w-0">
                {release.name}
              </span>
            </Tooltip>
          </div>
          <div
            role="presentation"
            className="flex h-full shrink-0 items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <CircularProgressIndicator
              size={20}
              percentage={completionPercentage}
              strokeWidth={4}
              strokeColor="stroke-accent-primary"
              variant="with-label"
            />
            <ReleaseBlockProperties
              release={release}
              isSidebarCollapsed={isSidebarCollapsed}
              workspaceSlug={workspaceSlug?.toString() ?? ""}
            />
            <CustomMenu ellipsis>
              <CustomMenu.MenuItem onClick={() => setIsDeleteModalOpen(true)}>
                <span className="flex items-center gap-2">
                  <TrashIcon className="size-3.5" />
                  <span>{t("releases.actions.delete")}</span>
                </span>
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
        </div>
      </button>
      <DeleteReleaseModal
        isOpen={isDeleteModalOpen}
        handleClose={() => setIsDeleteModalOpen(false)}
        release={release}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
});
