import React, { Fragment } from "react";

// headless ui
import { Tab } from "@headlessui/react";
// components
import { CustomAnalytics, ScopeAndDemand } from "components/analytics";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const tabsList = ["Scope and Demand", "Custom Analytics"];

export const AnalyticsWorkspaceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <div
        className={`absolute z-40 h-full w-full bg-brand-surface-1 p-2 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-brand-base bg-brand-surface-1 text-left">
          <div className="flex items-center justify-between gap-2 border-b border-b-brand-base bg-brand-sidebar p-3 text-sm">
            <h3>Workspace Analytics</h3>
            <div>
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
                <ScopeAndDemand isProjectLevel={false} />
              </Tab.Panel>
              <Tab.Panel as={Fragment}>
                <CustomAnalytics />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </>
  );
};
