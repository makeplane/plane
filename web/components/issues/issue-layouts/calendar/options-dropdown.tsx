import React from "react";
import { Popover, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";

// icons
import { ChevronUp } from "lucide-react";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {};

export const CalendarOptionsDropdown: React.FC<Props> = observer((props) => {
  const {} = props;

  const { issueFilter: issueFilterStore } = useMobxStore();

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
              <Popover.Panel className="absolute right-0 z-10 mt-1 bg-custom-background-100 border border-custom-border-200 shadow-custom-shadow-rg rounded overflow-hidden">
                Hi
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
});
