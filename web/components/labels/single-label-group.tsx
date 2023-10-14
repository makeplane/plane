import React from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// services
import { IssueLabelService } from "services/issue";
// ui
import { CustomMenu } from "components/ui";
// icons
import { ChevronDownIcon, XMarkIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Component, X } from "lucide-react";
// types
import { IUser, IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

type Props = {
  label: IIssueLabels;
  labelChildren: IIssueLabels[];
  addLabelToGroup: (parentLabel: IIssueLabels) => void;
  editLabel: (label: IIssueLabels) => void;
  handleLabelDelete: () => void;
  user: IUser | undefined;
};

// services
const issueLabelService = new IssueLabelService();

export const SingleLabelGroup: React.FC<Props> = ({
  label,
  labelChildren,
  addLabelToGroup,
  editLabel,
  handleLabelDelete,
  user,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const removeFromGroup = (label: IIssueLabels) => {
    if (!workspaceSlug || !projectId) return;

    mutate<IIssueLabels[]>(
      PROJECT_ISSUE_LABELS(projectId as string),
      (prevData) =>
        prevData?.map((l) => {
          if (l.id === label.id) return { ...l, parent: null };

          return l;
        }),
      false
    );

    issueLabelService
      .patchIssueLabel(
        workspaceSlug as string,
        projectId as string,
        label.id,
        {
          parent: null,
        },
        user
      )
      .then(() => {
        mutate(PROJECT_ISSUE_LABELS(projectId as string));
      });
  };

  return (
    <Disclosure
      as="div"
      className="rounded border border-custom-border-200 bg-custom-background-100 px-3.5 py-3 text-custom-text-100"
      defaultOpen
    >
      {({ open }) => (
        <>
          <div className="flex cursor-pointer items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Component className="h-4 w-4 text-custom-text-100 flex-shrink-0" />
              <h6>{label.name}</h6>
            </div>
            <div className="flex items-center gap-2">
              <CustomMenu ellipsis buttonClassName="!text-custom-sidebar-text-400">
                <CustomMenu.MenuItem onClick={() => addLabelToGroup(label)}>
                  <span className="flex items-center justify-start gap-2">
                    <PlusIcon className="h-4 w-4" />
                    <span>Add more labels</span>
                  </span>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => editLabel(label)}>
                  <span className="flex items-center justify-start gap-2">
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit label</span>
                  </span>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={handleLabelDelete}>
                  <span className="flex items-center justify-start gap-2">
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete label</span>
                  </span>
                </CustomMenu.MenuItem>
              </CustomMenu>
              <Disclosure.Button>
                <span>
                  <ChevronDownIcon
                    className={`h-4 w-4 text-custom-sidebar-text-400 ${!open ? "rotate-90 transform" : ""}`}
                  />
                </span>
              </Disclosure.Button>
            </div>
          </div>
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
              <div className="mt-2.5 ml-6">
                {labelChildren.map((child) => (
                  <div
                    key={child.id}
                    className="group flex items-center justify-between border-b border-custom-border-200 px-4 py-2.5 text-sm last:border-0"
                  >
                    <h5 className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: child.color && child.color !== "" ? child.color : "#000000",
                        }}
                      />
                      {child.name}
                    </h5>
                    <div className="flex items-center gap-3.5 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100">
                      <div className="h-4 w-4">
                        <CustomMenu
                          customButton={
                            <div className="h-4 w-4">
                              <Component className="h-4 w-4 leading-4 text-custom-sidebar-text-400 flex-shrink-0" />
                            </div>
                          }
                        >
                          <CustomMenu.MenuItem onClick={() => removeFromGroup(child)}>
                            <span className="flex items-center justify-start gap-2">
                              <XMarkIcon className="h-4 w-4" />
                              <span>Remove from group</span>
                            </span>
                          </CustomMenu.MenuItem>
                          <CustomMenu.MenuItem onClick={() => editLabel(child)}>
                            <span className="flex items-center justify-start gap-2">
                              <PencilIcon className="h-4 w-4" />
                              <span>Edit label</span>
                            </span>
                          </CustomMenu.MenuItem>
                        </CustomMenu>
                      </div>

                      <div className="flex items-center">
                        <button className="flex items-center justify-start gap-2" onClick={handleLabelDelete}>
                          <X className="h-[18px] w-[18px] text-custom-sidebar-text-400 flex-shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};
