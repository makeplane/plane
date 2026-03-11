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

import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
import { E_SORT_ORDER } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import type { IWorkflow } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity/sort-root";
import { WorkflowChangeHistoryItem } from "./item";
import { IconButton } from "@plane/propel/icon-button";
import useSWR from "swr";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  workflow: IWorkflow;
  onClose: () => void;
};

export const WorkflowChangeHistoryDrawer = observer(function WorkflowChangeHistoryDrawer(props: Props) {
  const { isOpen, workspaceSlug, workflow, onClose } = props;
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const loader = workflow.changeHistory.loader;
  const sortOrder = workflow.changeHistory.sortOrder as E_SORT_ORDER;
  const sortedActivities = workflow.changeHistory.sortedActivities;

  // SWR fetch
  useSWR(
    isOpen && workflow && workspaceSlug ? ["WORKFLOW_CHANGE_HISTORY", workspaceSlug] : null,
    isOpen && workflow && workspaceSlug ? () => workflow.changeHistory.fetch(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  useOutsideClickDetector(ref, () => {
    if (isOpen) onClose();
  });

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-0 right-0 h-full z-50 flex flex-col w-[368px] bg-surface-1 border-l border-subtle shadow-md py-4"
      )}
    >
      <div className="p-4 pt-2 flex flex-col">
        <div className="flex gap-2 items-center justify-between">
          <span className="text-16 font-medium">{t("common.change_history")}</span>
          <span className="flex items-center gap-2">
            {loader === "mutation" ? <Spinner size={12} className="animate-spin" /> : null}
            <ActivitySortRoot
              sortOrder={sortOrder}
              toggleSort={workflow.changeHistory.toggleSortOrder}
              variant="ghost"
            />
            <IconButton icon={CloseIcon} onClick={onClose} variant="ghost" />
          </span>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto vertical-scrollbar scrollbar-sm px-4">
        <div className="space-y-3">
          {loader === "init-loader" ? (
            <Loader className="space-y-3">
              <Loader.Item height="34px" width="100%" />
              <Loader.Item height="34px" width="100%" />
              <Loader.Item height="34px" width="100%" />
            </Loader>
          ) : (
            <div>
              {sortedActivities.map((changeHistory, index) => (
                <WorkflowChangeHistoryItem
                  key={changeHistory.id}
                  changeHistory={changeHistory}
                  ends={index === 0 ? "top" : index === sortedActivities.length - 1 ? "bottom" : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
