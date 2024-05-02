import { FC, Fragment } from "react";
import { Transition, Dialog } from "@headlessui/react";
// types
import { TIssue } from "@plane/types";
// components
import { InboxIssueCreateRoot, InboxIssueEditRoot } from "@/components/inbox/modals/create-edit-modal";

type TInboxIssueCreateEditModalRoot = {
  workspaceSlug: string;
  projectId: string;
  modalState: boolean;
  handleModalClose: () => void;
  issue: Partial<TIssue> | undefined;
  onSubmit?: () => void;
};

export const InboxIssueCreateEditModalRoot: FC<TInboxIssueCreateEditModalRoot> = (props) => {
  const { workspaceSlug, projectId, modalState, handleModalClose, issue, onSubmit } = props;

  return (
    <div>
      <Transition.Root show={modalState} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={handleModalClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-20 overflow-y-auto">
            <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all w-full lg:max-w-4xl">
                  {issue && issue?.id ? (
                    <InboxIssueEditRoot
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      issueId={issue.id}
                      issue={issue}
                      handleModalClose={handleModalClose}
                      onSubmit={onSubmit}
                    />
                  ) : (
                    <InboxIssueCreateRoot
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      handleModalClose={handleModalClose}
                    />
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};
