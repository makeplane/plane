import React, { useState } from "react";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
import { FullScreenPeekView, SidePeekView } from "components/issues/peek-overview";

// types
import type { IIssue } from "store/types";

type Props = {
  issue: IIssue | null;
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

export type TPeekOverviewModes = "side" | "modal" | "full";

export const IssuePeekOverview: React.FC<Props> = ({
  issue,
  isOpen,
  onClose,
  workspaceSlug,
}) => {
  const [peekOverviewMode, setPeekOverviewMode] = useState<TPeekOverviewModes>("side");

  const handleClose = () => {
    onClose();
    setPeekOverviewMode("side");
  };

  if (!issue || !isOpen) return null;

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        {/* add backdrop conditionally */}
        {(peekOverviewMode === "modal" || peekOverviewMode === "full") && (
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
          </Transition.Child>
        )}
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="relative h-full w-full">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={`absolute z-20 bg-custom-background-100 ${
                  peekOverviewMode === "side"
                    ? "top-0 right-0 h-full w-1/2 shadow-custom-shadow-md"
                    : peekOverviewMode === "modal"
                    ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[70%] w-3/5 rounded-lg shadow-custom-shadow-xl"
                    : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[95%] w-[95%] rounded-lg shadow-custom-shadow-xl"
                }`}
              >
                {(peekOverviewMode === "side" || peekOverviewMode === "modal") && (
                  <SidePeekView
                    handleClose={handleClose}
                    issueId={issue.id}
                    projectId={issue.project}
                    mode={peekOverviewMode}
                    setMode={(mode) => setPeekOverviewMode(mode)}
                    workspaceSlug={workspaceSlug}
                  />
                )}
                {peekOverviewMode === "full" && (
                  <FullScreenPeekView
                    issueId={issue.id}
                    workspaceSlug={workspaceSlug}
                    projectId={issue.project}
                    handleClose={handleClose}
                    mode={peekOverviewMode}
                    setMode={(mode) => setPeekOverviewMode(mode)}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
