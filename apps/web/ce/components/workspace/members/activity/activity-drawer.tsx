/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useState } from "react";
import { observer } from "mobx-react";
import { Dialog, Transition } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";
import { renderFormattedPayloadDate } from "@plane/utils";
// local imports
import type { TWorkspaceActivityDateRange } from "./activity-filters";
import { WorkspaceActivityFilters } from "./activity-filters";
import type { TWorkspaceActivityFilterParams } from "./activity-list";
import { WorkspaceActivityList } from "./activity-list";

type TWorkspaceActivityDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

const getDateRangeStartDate = (dateRange: TWorkspaceActivityDateRange): string | undefined => {
  if (dateRange === "all_time") return undefined;

  const startDate = new Date();
  if (dateRange === "last_7_days") startDate.setDate(startDate.getDate() - 7);
  if (dateRange === "last_30_days") startDate.setDate(startDate.getDate() - 30);
  return renderFormattedPayloadDate(startDate);
};

export const WorkspaceActivityDrawer = observer(function WorkspaceActivityDrawer(props: TWorkspaceActivityDrawerProps) {
  const { isOpen, onClose, workspaceSlug } = props;
  // states
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<TWorkspaceActivityDateRange>("last_30_days");
  // plane hooks
  const { t } = useTranslation();

  // derived values
  const filterParams: TWorkspaceActivityFilterParams = {
    actor: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
    project: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
    start_date: getDateRangeStartDate(dateRange),
  };
  // remount the paginated list (and reset its cursor state) whenever a filter changes
  const activityListKey = `${selectedMemberIds.join(",")}_${selectedProjectIds.join(",")}_${dateRange}`;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-30 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                <div className="flex h-full flex-col overflow-hidden border-l border-subtle bg-surface-1 shadow-raised-200">
                  {/* header */}
                  <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-subtle px-6 py-4">
                    <Dialog.Title as="h3" className="text-16 font-medium">
                      {t("workspace_settings.settings.members.activity.title")}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="grid flex-shrink-0 place-items-center rounded-sm p-1 text-secondary hover:bg-layer-transparent-hover"
                      onClick={onClose}
                      aria-label={t("close")}
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {/* filters */}
                  <div className="flex-shrink-0 border-b border-subtle px-6 py-3">
                    <WorkspaceActivityFilters
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                      onMembersChange={setSelectedMemberIds}
                      onProjectsChange={setSelectedProjectIds}
                      selectedMemberIds={selectedMemberIds}
                      selectedProjectIds={selectedProjectIds}
                    />
                  </div>
                  {/* body */}
                  <div className="vertical-scrollbar scrollbar-md h-full overflow-y-auto px-6">
                    <WorkspaceActivityList
                      key={activityListKey}
                      filterParams={filterParams}
                      workspaceSlug={workspaceSlug}
                    />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
