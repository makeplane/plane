import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// components
import { FullScreenPeekView, SidePeekView } from "components/issues/peek-overview";
// lib
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {};

export const IssuePeekOverview: React.FC<Props> = observer(() => {
  // states
  const [isSidePeekOpen, setIsSidePeekOpen] = useState(false);
  const [isModalPeekOpen, setIsModalPeekOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspace_slug, project_slug, peekId, board, priorities, states, labels } = router.query as {
    workspace_slug: string;
    project_slug: string;
    peekId: string;
    board: string;
    priorities: string;
    states: string;
    labels: string;
  };
  // store
  const { issueDetails: issueDetailStore, issue: issueStore } = useMobxStore();
  const issueDetails = issueDetailStore.peekId && peekId ? issueDetailStore.details[peekId.toString()] : undefined;

  useEffect(() => {
    if (workspace_slug && project_slug && peekId && issueStore.issues && issueStore.issues.length > 0) {
      if (!issueDetails) {
        issueDetailStore.fetchIssueDetails(workspace_slug.toString(), project_slug.toString(), peekId.toString());
      }
    }
  }, [workspace_slug, project_slug, issueDetailStore, issueDetails, peekId, issueStore.issues]);

  const handleClose = () => {
    issueDetailStore.setPeekId(null);

    const params: any = { board: board };
    if (states && states.length > 0) params.states = states;
    if (priorities && priorities.length > 0) params.priorities = priorities;
    if (labels && labels.length > 0) params.labels = labels;

    router.replace({ pathname: `/${workspace_slug?.toString()}/${project_slug}`, query: { ...params } }, undefined, {
      shallow: true,
    });
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
      <Transition.Root appear show={isSidePeekOpen} as={React.Fragment}>
        <Dialog as="div" onClose={handleClose}>
          <Transition.Child
            as={React.Fragment}
            enter="transition-transform duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed right-0 top-0 z-20 h-full w-1/2 bg-custom-background-100 shadow-custom-shadow-sm">
              <SidePeekView handleClose={handleClose} issueDetails={issueDetails} />
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
      <Transition.Root appear show={isModalPeekOpen} as={React.Fragment}>
        <Dialog as="div" onClose={handleClose}>
          <Transition.Child
            as={React.Fragment}
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
            as={React.Fragment}
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
                  <SidePeekView handleClose={handleClose} issueDetails={issueDetails} />
                )}
                {issueDetailStore.peekMode === "full" && (
                  <FullScreenPeekView handleClose={handleClose} issueDetails={issueDetails} />
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
    </>
  );
});
