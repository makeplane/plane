"use client";

import { useState } from "react";
import { ChevronRight, ChevronUp } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
import { Button } from "@plane/ui";
import { CreateProjectModal } from "@/components/project";
import { useProject } from "@/hooks/store";

interface Props {
  workspaceSlug: string;
  projectId: string;
}

export const DuplicateProjectSection: React.FC<Props> = ({
  workspaceSlug,
  projectId,
}) => {
  const { getProjectById } = useProject();
  const projectDetails = getProjectById(projectId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultData = projectDetails
    ? {
        ...projectDetails,
        name: `${projectDetails.name} copy`,
        identifier: `${projectDetails.identifier}-COPY`,
      }
    : undefined;

  return (
    <Disclosure as="div" className="border-t border-custom-border-100 py-4">
      {({ open }) => (
        <div className="w-full">
          <Disclosure.Button as="button" type="button" className="flex w-full items-center justify-between">
            <span className="text-xl tracking-tight">Duplicate project</span>
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Disclosure.Button>
          <Transition
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform opacity-0"
            enterTo="transform opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform opacity-100"
            leaveTo="transform opacity-0"
          >
            <Disclosure.Panel>
              <div className="flex flex-col gap-8 pt-4">
                <span className="text-sm tracking-tight">
                  Create a new project with the current project's configuration.
                </span>
                <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                  Duplicate project
                </Button>
              </div>
            </Disclosure.Panel>
          </Transition>
          {workspaceSlug && (
            <CreateProjectModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              workspaceSlug={workspaceSlug}
              data={defaultData}
              templateId={projectId}
            />
          )}
        </div>
      )}
    </Disclosure>
  );
};

export default DuplicateProjectSection;
