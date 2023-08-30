import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
// components
import { FullScreenPeekView, SidePeekView } from "components/issues/peek-overview";
// types
import type { IIssue } from "types/issue";
// lib
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const IssuePeekOverview: React.FC<Props> = observer((props) => {
  const { isOpen, onClose } = props;
  // router
  const router = useRouter();
  const { workspace_slug, project_slug } = router.query;
  // store
  const { issueDetails: issueDetailStore } = useMobxStore();

  const issueDetails = issueDetailStore.peekId ? issueDetailStore.details[issueDetailStore.peekId] : null;
  console.log("issueDetails", issueDetails);

  useEffect(() => {
    if (workspace_slug && project_slug && issueDetailStore.peekId) {
      if (!issueDetails) {
        issueDetailStore.fetchIssueDetails(workspace_slug.toString(), project_slug.toString(), issueDetailStore.peekId);
      }
    }
  }, [workspace_slug, project_slug, issueDetailStore, issueDetails]);

  const handleClose = () => {
    onClose();
    issueDetailStore.setPeekMode("side");
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        {/* add backdrop conditionally */}
        {(issueDetailStore.peekMode === "modal" || issueDetailStore.peekMode === "full") && (
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
                  issueDetailStore.peekMode === "side"
                    ? "top-0 right-0 h-full w-1/2 shadow-custom-shadow-md"
                    : issueDetailStore.peekMode === "modal"
                    ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[70%] w-3/5 rounded-lg shadow-custom-shadow-xl"
                    : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[95%] w-[95%] rounded-lg shadow-custom-shadow-xl"
                }`}
              >
                {(issueDetailStore.peekMode === "side" || issueDetailStore.peekMode === "modal") && (
                  <SidePeekView handleClose={handleClose} issueDetails={issueDetails} />
                )}
                {issueDetailStore.peekMode === "full" && (
                  <FullScreenPeekView handleClose={handleClose} issueDetails={issueDetails} />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
