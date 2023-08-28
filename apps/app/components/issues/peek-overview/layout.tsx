import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// components
import { FullScreenPeekView, SidePeekView } from "components/issues";
// services
import issuesService from "services/issues.service";
// types
import { IIssue } from "types";
// fetch-keys
import { PROJECT_ISSUES_DETAILS } from "constants/fetch-keys";
import useUser from "hooks/use-user";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  projectId: string;
  workspaceSlug: string;
  readOnly: boolean;
};

export type TPeekOverviewModes = "side" | "modal" | "full";

export const IssuePeekOverview: React.FC<Props> = observer(
  ({ projectId, workspaceSlug, readOnly }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [peekOverviewMode, setPeekOverviewMode] = useState<TPeekOverviewModes>("side");

    const router = useRouter();
    const { peekIssue } = router.query;

    const { issues: issuesStore } = useMobxStore();
    const { getIssueById, issues, updateIssue } = issuesStore;

    const issue = issues[peekIssue?.toString() ?? ""];

    const { user } = useUser();

    const handleClose = () => {
      const { query } = router;
      delete query.peekIssue;

      router.push({
        pathname: router.pathname,
        query: { ...query },
      });

      setPeekOverviewMode("side");
    };

    const handleUpdateIssue = async (formData: Partial<IIssue>) => {
      if (!issue || !user) return;

      await updateIssue(workspaceSlug, projectId, issue.id, formData, user);
    };

    useEffect(() => {
      if (!peekIssue) return;

      getIssueById(workspaceSlug, projectId, peekIssue.toString());
    }, [getIssueById, peekIssue, projectId, workspaceSlug]);

    useEffect(() => {
      if (peekIssue) setIsOpen(true);
      else setIsOpen(false);
    }, [peekIssue]);

    return (
      <Transition.Root appear show={isOpen} as={React.Fragment}>
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
                enter="transition-transform duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transition-transform duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
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
                      handleUpdateIssue={handleUpdateIssue}
                      issue={issue}
                      mode={peekOverviewMode}
                      readOnly={readOnly}
                      setMode={(mode) => setPeekOverviewMode(mode)}
                      workspaceSlug={workspaceSlug}
                    />
                  )}
                  {peekOverviewMode === "full" && (
                    <FullScreenPeekView
                      handleClose={handleClose}
                      handleUpdateIssue={handleUpdateIssue}
                      issue={issue}
                      mode={peekOverviewMode}
                      readOnly={readOnly}
                      setMode={(mode) => setPeekOverviewMode(mode)}
                      workspaceSlug={workspaceSlug}
                    />
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    );
  }
);
