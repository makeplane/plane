// next
import { useRouter } from "next/router";
// react
import { Fragment } from "react";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
// services
import issuesServices from "lib/services/issues.services";
import projectService from "lib/services/project.service";
// swr
import useSWR from "swr";
// types
import { IIssue, ProjectMember } from "types";
// constants
import { PROJECT_ISSUES_DETAILS, PROJECT_MEMBERS } from "constants/fetch-keys";
import { Button } from "ui";
import { ChartBarIcon, Squares2X2Icon, TagIcon, UserIcon } from "@heroicons/react/24/outline";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  issueId: string | null;
};

const IssuePreviewModal = ({ isOpen, setIsOpen, issueId }: Props) => {
  const closeModal = () => {
    setIsOpen(false);
  };

  const { activeWorkspace, activeProject } = useUser();

  const router = useRouter();

  const { data: issueDetails } = useSWR<IIssue | null>(
    activeWorkspace && activeProject && issueId ? PROJECT_ISSUES_DETAILS(issueId) : null,
    activeWorkspace && activeProject && issueId
      ? () => issuesServices.getIssue(activeWorkspace.slug, activeProject.id, issueId)
      : null
  );

  const { data: users } = useSWR<ProjectMember[] | null>(
    activeWorkspace && activeProject ? PROJECT_MEMBERS(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => projectService.projectMembers(activeWorkspace.slug, activeProject.id)
      : null
  );

  return (
    <>
      <Transition.Root appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-xl flex flex-col gap-1 font-medium leading-6 text-gray-900"
                  >
                    {issueDetails?.project_detail.identifier}-{issueDetails?.sequence_id}{" "}
                    {issueDetails?.name}
                    <span className="text-sm text-gray-500 font-normal">
                      Created by{" "}
                      {users?.find((u) => u.id === issueDetails?.created_by)?.member.first_name}
                    </span>
                  </Dialog.Title>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">{issueDetails?.description}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 sm:text-sm">
                      <Squares2X2Icon className="h-3 w-3" />
                      {issueDetails?.state_detail.name}
                    </span>
                    <span className="flex items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 capitalize sm:text-sm">
                      <ChartBarIcon className="h-3 w-3" />
                      {issueDetails?.priority}
                    </span>
                    <span className="flex items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 capitalize sm:text-sm">
                      <TagIcon className="h-3 w-3" />
                      {issueDetails?.label_details && issueDetails.label_details.length > 0
                        ? issueDetails.label_details.map((label) => (
                            <span key={label.id}>{label.name}</span>
                          ))
                        : "None"}
                    </span>
                    <span className="flex items-center gap-1 hover:bg-gray-100 border rounded-md shadow-sm px-2 py-1 capitalize sm:text-sm">
                      <UserIcon className="h-3 w-3" />
                      {issueDetails?.assignee_details && issueDetails.assignee_details.length > 0
                        ? issueDetails.assignee_details.map((assignee) => (
                            <span key={assignee.id}>{assignee.first_name}</span>
                          ))
                        : "None"}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-3 justify-end">
                    <Button
                      onClick={() =>
                        router.push(`/projects/${activeProject?.id}/issues/${issueId}`)
                      }
                    >
                      View in Detail
                    </Button>
                    <Button onClick={closeModal}>Close</Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default IssuePreviewModal;
