"use client";

import { FC, Fragment, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
// components
import { FullScreenPeekView, SidePeekView } from "@/components/issues/peek-overview";
// store
import { useIssue, useIssueDetails } from "@/hooks/store";

type TIssuePeekOverview = {
  workspaceSlug: string;
  projectId: string;
  peekId: string;
};

export const IssuePeekOverview: FC<TIssuePeekOverview> = observer((props) => {
  const { workspaceSlug, projectId, peekId } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;
  // states
  const [isSidePeekOpen, setIsSidePeekOpen] = useState(false);
  const [isModalPeekOpen, setIsModalPeekOpen] = useState(false);
  // store
  const issueDetailStore = useIssueDetails();
  const issueStore = useIssue();

  const issueDetails = issueDetailStore.peekId && peekId ? issueDetailStore.details[peekId.toString()] : undefined;

  useEffect(() => {
    if (workspaceSlug && projectId && peekId && issueStore.issues && issueStore.issues.length > 0) {
      if (!issueDetails) {
        issueDetailStore.fetchIssueDetails(workspaceSlug.toString(), projectId.toString(), peekId.toString());
      }
    }
  }, [workspaceSlug, projectId, issueDetailStore, issueDetails, peekId, issueStore.issues]);

  const handleClose = () => {
    issueDetailStore.setPeekId(null);
    let queryParams: any = { board: board };
    if (priority && priority.length > 0) queryParams = { ...queryParams, priority: priority };
    if (state && state.length > 0) queryParams = { ...queryParams, state: state };
    if (labels && labels.length > 0) queryParams = { ...queryParams, labels: labels };
    queryParams = new URLSearchParams(queryParams).toString();
    router.push(`/${workspaceSlug}/${projectId}?${queryParams}`);
  };

  useEffect(() => {
    if (peekId) {
      if (issueDetailStore.peekMode === "side") {
        setIsSidePeekOpen(true);
        setIsModalPeekOpen(false);
      } else {
        setIsModalPeekOpen(true);
        setIsSidePeekOpen(false);
      }
    } else {
      setIsSidePeekOpen(false);
      setIsModalPeekOpen(false);
    }
  }, [peekId, issueDetailStore.peekMode]);

  return (
    <>
      <Transition.Root appear show={isSidePeekOpen} as={Fragment}>
        <Dialog as="div" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed right-0 top-0 z-20 h-full w-1/2 bg-custom-background-100 shadow-custom-shadow-sm">
              <SidePeekView
                handleClose={handleClose}
                issueDetails={issueDetails}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
              />
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
      <Transition.Root appear show={isModalPeekOpen} as={Fragment}>
        <Dialog as="div" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 z-20 bg-custom-backdrop bg-opacity-50 transition-opacity" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Panel>
              <div
                className={`fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-custom-background-100 shadow-custom-shadow-xl transition-all duration-300 ${
                  issueDetailStore.peekMode === "modal" ? "h-[70%] w-3/5" : "h-[95%] w-[95%]"
                }`}
              >
                {issueDetailStore.peekMode === "modal" && (
                  <SidePeekView
                    handleClose={handleClose}
                    issueDetails={issueDetails}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                  />
                )}
                {issueDetailStore.peekMode === "full" && (
                  <FullScreenPeekView
                    handleClose={handleClose}
                    issueDetails={issueDetails}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                  />
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
    </>
  );
});
