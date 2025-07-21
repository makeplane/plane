"use client";

import React from "react";
import { ChevronRight, ChevronUp } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// types
import { PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { IProject } from "@plane/types";
// ui
import { Button, Loader } from "@plane/ui";

export interface IDeleteProjectSection {
  projectDetails: IProject;
  handleDelete: () => void;
}

export const DeleteProjectSection: React.FC<IDeleteProjectSection> = (props) => {
  const { projectDetails, handleDelete } = props;

  return (
    <Disclosure as="div" className="border-t border-custom-border-100 py-4">
      {({ open }) => (
        <div className="w-full">
          <Disclosure.Button as="button" type="button" className="flex w-full items-center justify-between">
            <span className="text-xl tracking-tight">Delete project</span>
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
                  When deleting a project, all of the data and resources within that project will be permanently removed
                  and cannot be recovered.
                </span>
                <div>
                  {projectDetails ? (
                    <div>
                      <Button
                        variant="danger"
                        onClick={handleDelete}
                        data-ph-element={PROJECT_TRACKER_ELEMENTS.DELETE_PROJECT_BUTTON}
                      >
                        Delete my project
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
