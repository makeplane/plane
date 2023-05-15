import React, { Fragment, useState } from "react";

// headless ui
import { Tab } from "@headlessui/react";
// components
import { CustomAnalytics, ScopeAndDemand } from "components/analytics";
// icons
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const tabsList = ["Scope and Demand", "Custom Analytics"];

export const AnalyticsProjectModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [fullScreen, setFullScreen] = useState(false);

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className={`absolute top-0 z-30 h-full bg-brand-surface-1 ${
        fullScreen ? "p-2 w-full" : "w-1/2"
      } ${isOpen ? "right-0" : "-right-full"} duration-300 transition-all`}
    >
      <div
        className={`flex h-full flex-col overflow-hidden border-brand-base bg-brand-surface-1 text-left ${
          fullScreen ? "rounded-lg border" : "border-l"
        }`}
      >
        <div
          className={`flex items-center justify-between gap-2 border-b border-b-brand-base bg-brand-sidebar p-3 text-sm ${
            fullScreen ? "" : "py-[1.275rem]"
          }`}
        >
          <h3>Project Analytics</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid place-items-center p-1 text-brand-secondary hover:text-brand-base"
              onClick={() => setFullScreen((prevData) => !prevData)}
            >
              {fullScreen ? (
                <ArrowsPointingInIcon className="h-4 w-4" />
              ) : (
                <ArrowsPointingOutIcon className="h-3 w-3" />
              )}
            </button>
            <button
              type="button"
              className="grid place-items-center p-1 text-brand-secondary hover:text-brand-base"
              onClick={handleClose}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <Tab.Group as={Fragment}>
          <Tab.List className="space-x-2 border-b border-brand-base px-5 py-3">
            {tabsList.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `rounded-3xl border border-brand-base px-4 py-2 text-xs hover:bg-brand-base ${
                    selected ? "bg-brand-base" : ""
                  }`
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels as={Fragment}>
            <Tab.Panel as={Fragment}>
              <ScopeAndDemand fullScreen={fullScreen} isProjectLevel />
            </Tab.Panel>
            <Tab.Panel as={Fragment}>
              <CustomAnalytics fullScreen={fullScreen} isProjectLevel />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};
