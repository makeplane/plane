"use client";

import React from "react";
import { ChevronRight, ChevronUp } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// types
import { IProject } from "@plane/types";
// ui
import { Button, Loader } from "@plane/ui";

export interface IArchiveProject {
  projectDetails: IProject;
  handleArchive: () => void;
}

export const ArchiveProjectSelection: React.FC<IArchiveProject> = (props) => {
  const { projectDetails, handleArchive } = props;

  return (
    <Disclosure as="div" className="border-t border-custom-border-100 py-4">
      {({ open }) => (
        <div className="w-full">
          <Disclosure.Button as="button" type="button" className="flex w-full items-center justify-between">
            <span className="text-xl tracking-tight">Archive project</span>
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
                  Archiving a project will unlist your project from your side navigation although you will still be able
                  to access it from your projects page. You can restore the project or delete it whenever you want.
                </span>
                <div>
                  {projectDetails ? (
                    <div>
                      <Button variant="outline-danger" onClick={handleArchive}>
                        Archive project
                      </Button>
                    </div>
                  ) : (
                    <Loader className="mt-2 w-full">
                      <Loader.Item height="38px" width="144px" />
                    </Loader>
                  )}
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
};
