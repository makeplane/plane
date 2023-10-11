import { useState, Fragment } from "react";
import { Transition, Dialog } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";
// types
import type { IProject } from "types";
// lib
import { useMobxStore } from "lib/mobx/store-provider";

// type
type TJoinProjectModalProps = {
  isOpen: boolean;
  workspaceSlug: string;
  project: IProject;
  handleClose: () => void;
};

export const JoinProjectModal: React.FC<TJoinProjectModalProps> = (props) => {
  const { handleClose, isOpen, project, workspaceSlug } = props;
  // store
  const { project: projectStore } = useMobxStore();
  // states
  const [isJoiningLoading, setIsJoiningLoading] = useState(false);

  const handleJoin = () => {
    setIsJoiningLoading(true);

    projectStore
      .joinProject(workspaceSlug, [project.id])
      .then(() => {
        setIsJoiningLoading(false);
        handleClose();
      })
      .catch(() => {
        setIsJoiningLoading(false);
      });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#131313] bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 border border-custom-border-300 px-5 py-8 text-left shadow-xl transition-all sm:w-full sm:max-w-xl sm:p-6">
                <div className="space-y-5">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                    Join Project?
                  </Dialog.Title>
                  <p>
                    Are you sure you want to join <span className="font-semibold">{project?.name}</span>?
                  </p>
                  <div className="space-y-3" />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="neutral-primary" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" onClick={handleJoin} loading={isJoiningLoading}>
                    {isJoiningLoading ? "Joining..." : "Join Project"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
