import React, { useState } from "react";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
import {
  PeakOverviewHeader,
  PeakOverviewIssueActivity,
  PeakOverviewIssueDetails,
  PeakOverviewIssueProperties,
} from "components/issues";
// types
import { IIssue } from "types";

type Props = {
  handleUpdateIssue: (issue: Partial<IIssue>) => Promise<void>;
  issue: IIssue | null;
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  readOnly: boolean;
};

export type TPeakOverviewModes = "side" | "modal" | "full";

export const IssuePeakOverview: React.FC<Props> = ({
  handleUpdateIssue,
  issue,
  isOpen,
  onClose,
  workspaceSlug,
  readOnly,
}) => {
  const [peakOverviewMode, setPeakOverviewMode] = useState<TPeakOverviewModes>("side");

  const handleClose = () => {
    onClose();
    setPeakOverviewMode("side");
  };

  if (!issue || !isOpen) return null;

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        {/* add backdrop conditionally */}
        {(peakOverviewMode === "modal" || peakOverviewMode === "full") && (
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
        )}

        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="translate-x-full sm:translate-x-0"
          enterTo="translate-x-0"
          leave="ease-in duration-300"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full sm:translate-x-0"
        >
          <Dialog.Panel
            className={`fixed z-20 bg-custom-background-100 ${
              peakOverviewMode === "side"
                ? "top-0 right-0 h-full w-1/2"
                : peakOverviewMode === "modal"
                ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[70%] w-3/5 rounded-lg"
                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[95%] w-[95%] rounded-lg"
            }`}
          >
            <div className="flex flex-col h-full w-full overflow-hidden">
              <div className="p-5">
                <PeakOverviewHeader
                  handleClose={handleClose}
                  issue={issue}
                  mode={peakOverviewMode}
                  setMode={setPeakOverviewMode}
                />
              </div>
              <div className="px-6 py-5 h-full w-full overflow-y-auto">
                {/* issue title and description */}
                <div className="w-full">
                  <PeakOverviewIssueDetails
                    handleUpdateIssue={handleUpdateIssue}
                    issue={issue}
                    readOnly={readOnly}
                    workspaceSlug={workspaceSlug}
                  />
                </div>
                {/* issue properties */}
                <div className="mt-10 w-full">
                  <PeakOverviewIssueProperties
                    issue={issue}
                    onChange={handleUpdateIssue}
                    readOnly={readOnly}
                  />
                </div>
                {/* divider */}
                <div className="h-[1] w-full border-t border-custom-border-200 my-5" />
                {/* issue activity/comments */}
                <div className="w-full">
                  <PeakOverviewIssueActivity
                    workspaceSlug={workspaceSlug}
                    issue={issue}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
};
