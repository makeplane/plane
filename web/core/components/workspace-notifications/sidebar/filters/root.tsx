"use client";

import { FC, Fragment } from "react";
import { observer } from "mobx-react";
import { Check, Clock, ListFilter } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
import { TNotificationFilter } from "@plane/types";
import { ArchiveIcon } from "@plane/ui";
// constants
import { ENotificationFilterType, FILTER_TYPE_OPTIONS } from "@/constants/notification";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useWorkspaceNotification } from "@/hooks/store";

export const NotificationFilter: FC = observer((props) => {
  const {} = props;
  // hooks
  const { filters, updateFilters } = useWorkspaceNotification();

  const handleFilterTypeChange = (filterType: ENotificationFilterType, filterValue: boolean) =>
    updateFilters("type", {
      ...filters.type,
      [filterType]: filterValue,
    });

  const handleFilterChange = (filterType: keyof TNotificationFilter, filterValue: boolean) =>
    updateFilters(filterType, filterValue);

  return (
    <Popover className="relative">
      <Popover.Button
        className={cn(
          "flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm outline-none",
          ({ open }: { open: boolean }) => (open ? "bg-custom-background-80" : "")
        )}
      >
        <ListFilter className="h-3 w-3" />
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute mt-2 right-0 z-10 min-w-44">
          <div className="py-3 rounded-md border border-custom-border-200 bg-custom-background-100 space-y-1">
            <div className="px-3 space-y-1">
              <div className="text-xs text-custom-text-300 font-medium whitespace-nowrap">
                Filter issue notifications
              </div>
              <div>
                {FILTER_TYPE_OPTIONS.map((filter) => {
                  const isSelected = filters?.type?.[filter?.value] || false;
                  return (
                    <div
                      key={filter.value}
                      className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
                      onClick={() => handleFilterTypeChange(filter?.value, !isSelected)}
                    >
                      <div
                        className={cn(
                          "flex-shrink-0 w-3 h-3 flex justify-center items-center rounded-sm transition-all",
                          isSelected ? "bg-custom-primary-100" : "bg-custom-background-90"
                        )}
                      >
                        {isSelected && <Check className="h-2 w-2" />}
                      </div>
                      <div
                        className={cn(
                          "whitespace-nowrap",
                          isSelected ? "text-custom-text-100" : "text-custom-text-200"
                        )}
                      >
                        {filter.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-custom-border-200 " />

            <div className="px-3">
              <div
                className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
                onClick={() => handleFilterChange("archived", !filters?.archived)}
              >
                <ArchiveIcon className="flex-shrink-0 h-3 w-3" />
                <div
                  className={cn(
                    "whitespace-nowrap",
                    filters?.archived ? "text-custom-text-100" : "text-custom-text-200"
                  )}
                >
                  Show Archived
                </div>
                {filters?.archived && (
                  <div className="ml-auto flex-shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>

              <div
                className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
                onClick={() => handleFilterChange("snoozed", !filters?.snoozed)}
              >
                <Clock className="flex-shrink-0 h-3 w-3" />
                <div
                  className={cn(
                    "whitespace-nowrap",
                    filters?.snoozed ? "text-custom-text-100" : "text-custom-text-200"
                  )}
                >
                  Show Snoozed
                </div>
                {filters?.snoozed && (
                  <div className="ml-auto flex-shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
