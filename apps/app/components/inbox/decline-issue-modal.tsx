import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import inboxServices from "services/inbox.service";
// hooks
import useToast from "hooks/use-toast";
import useInboxView from "hooks/use-inbox-view";
import useUser from "hooks/use-user";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// ui
import { SecondaryButton, DangerButton } from "components/ui";
// types
import type { IInboxIssue, ICurrentUserResponse, IInboxIssueDetail } from "types";
// fetch-keys
import { INBOX_ISSUES, INBOX_ISSUE_DETAILS } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data: IInboxIssue | undefined;
};

export const DeclineIssueModal: React.FC<Props> = ({ isOpen, handleClose, data }) => {
  const [isDeclining, setIsDeclining] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId } = router.query;

  const { user } = useUser();
  const { setToastAlert } = useToast();
  const { params } = useInboxView();

  const onClose = () => {
    setIsDeclining(false);
    handleClose();
  };

  const handleDecline = () => {
    if (!workspaceSlug || !projectId || !inboxId || !data) return;

    setIsDeclining(true);

    inboxServices
      .markInboxStatus(
        workspaceSlug.toString(),
        projectId.toString(),
        inboxId.toString(),
        data.bridge_id,
        {
          status: -1,
        },
        user
      )
      .then(() => {
        mutate<IInboxIssueDetail>(
          INBOX_ISSUE_DETAILS(inboxId.toString(), data.bridge_id),
          (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              issue_inbox: [{ ...prevData.issue_inbox[0], status: -1 }],
            };
          },
          false
        );
        mutate<IInboxIssue[]>(
          INBOX_ISSUES(inboxId.toString(), params),
          (prevData) =>
            prevData?.map((i) =>
              i.bridge_id === data.bridge_id
                ? { ...i, issue_inbox: [{ ...i.issue_inbox[0], status: -1 }] }
                : i
            ),
          false
        );

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issue declined successfully.",
        });
        onClose();
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issue could not be declined. Please try again.",
        })
      )
      .finally(() => setIsDeclining(false));
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-brand-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-brand-base bg-brand-base text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-6 p-6">
                  <div className="flex w-full items-center justify-start gap-6">
                    <span className="place-items-center rounded-full bg-red-500/20 p-4">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center justify-start">
                      <h3 className="text-xl font-medium 2xl:text-2xl">Decline Issue</h3>
                    </span>
                  </div>
                  <span>
                    <p className="text-sm text-brand-secondary">
                      Are you sure you want to decline issue{" "}
                      <span className="break-all font-medium text-brand-base">
                        {data?.project_detail?.identifier}-{data?.sequence_id}
                      </span>
                      {""}? This action cannot be undone.
                    </p>
                  </span>
                  <div className="flex justify-end gap-2">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <DangerButton onClick={handleDecline} loading={isDeclining}>
                      {isDeclining ? "Declining..." : "Decline Issue"}
                    </DangerButton>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
