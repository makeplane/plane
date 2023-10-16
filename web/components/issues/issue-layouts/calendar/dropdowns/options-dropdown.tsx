import React from "react";
import { useRouter } from "next/router";
import { Popover, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { ToggleSwitch } from "@plane/ui";
// icons
import { Check, ChevronUp } from "lucide-react";
// types
import { TCalendarLayouts } from "types";
// constants
import { CALENDAR_LAYOUTS } from "constants/calendar";

export const CalendarOptionsDropdown: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore, calendar: calendarStore } = useMobxStore();

  const calendarLayout = issueFilterStore.userDisplayFilters.calendar?.layout ?? "month";
  const showWeekends = issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false;

  const handleLayoutChange = (layout: TCalendarLayouts) => {
    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        calendar: {
          ...issueFilterStore.userDisplayFilters.calendar,
          layout,
        },
      },
    });

    calendarStore.updateCalendarPayload(
      layout === "month" ? calendarStore.calendarFilters.activeMonthDate : calendarStore.calendarFilters.activeWeekDate
    );
  };

  const handleToggleWeekends = () => {
    const showWeekends = issueFilterStore.userDisplayFilters.calendar?.show_weekends ?? false;

    if (!workspaceSlug || !projectId) return;

    issueFilterStore.updateUserFilters(workspaceSlug.toString(), projectId.toString(), {
      display_filters: {
        calendar: {
          ...issueFilterStore.userDisplayFilters.calendar,
          show_weekends: !showWeekends,
        },
      },
    });
  };

  return (
    <Popover className="relative">
      {({ open }) => {
        if (open) {
        }
        return (
          <>
            <Popover.Button
              className={`outline-none bg-custom-background-80 text-xs rounded flex items-center gap-1.5 px-2.5 py-1 hover:bg-custom-background-80 ${
                open ? "text-custom-text-100" : "text-custom-text-200"
              }`}
            >
              <div className="font-medium">Options</div>
              <div
                className={`w-3.5 h-3.5 flex items-center justify-center transition-all ${open ? "" : "rotate-180"}`}
              >
                <ChevronUp width={12} strokeWidth={2} />
              </div>
            </Popover.Button>
            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel>
                <div className="absolute right-0 z-10 mt-1 bg-custom-background-100 border border-custom-border-200 shadow-custom-shadow-rg rounded min-w-[12rem] p-1 overflow-hidden">
                  <div>
                    {Object.entries(CALENDAR_LAYOUTS).map(([layout, layoutDetails]) => (
                      <button
                        key={layout}
                        type="button"
                        className="text-xs hover:bg-custom-background-80 w-full text-left px-1 py-1.5 rounded flex items-center justify-between gap-2"
                        onClick={() => handleLayoutChange(layoutDetails.key)}
                      >
                        {layoutDetails.title}
                        {calendarLayout === layout && <Check size={12} strokeWidth={2} />}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="text-xs hover:bg-custom-background-80 w-full text-left px-1 py-1.5 rounded flex items-center justify-between gap-2"
                      onClick={handleToggleWeekends}
                    >
                      Show weekends
                      <ToggleSwitch value={showWeekends} onChange={() => {}} />
                    </button>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
});
