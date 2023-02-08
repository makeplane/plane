import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// services
import issuesService from "services/issues.service";
// components
import { LabelsListModal } from "components/labels";
// ui
import { CustomMenu } from "components/ui";
// icons
import { ChevronDownIcon } from "@heroicons/react/24/outline";
// types
import { IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

type Props = {
  label: IIssueLabels;
  issueLabels: IIssueLabels[];
  editLabel: (label: IIssueLabels) => void;
  handleLabelDelete: (labelId: string) => void;
};

export const SingleLabel: React.FC<Props> = ({
  label,
  issueLabels,
  editLabel,
  handleLabelDelete,
}) => {
  const [labelsListModal, setLabelsListModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const children = issueLabels?.filter((l) => l.parent === label.id);

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

    issuesService
      .patchIssueLabel(workspaceSlug as string, projectId as string, label.id, {
        parent: null,
      })
      .then((res) => {
        mutate(PROJECT_ISSUE_LABELS(projectId as string));
      });
  };

  return (
    <>
      <LabelsListModal
        isOpen={labelsListModal}
        handleClose={() => setLabelsListModal(false)}
        parent={label}
      />
      {children && children.length === 0 ? (
        label.parent === "" || !label.parent ? (
          <div className="gap-2 space-y-3 divide-y rounded-md border p-3 md:w-2/3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: label.color,
                  }}
                />
                <h6 className="text-sm">{label.name}</h6>
              </div>
              <CustomMenu ellipsis>
                <CustomMenu.MenuItem onClick={() => setLabelsListModal(true)}>
                  Convert to group
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => editLabel(label)}>Edit</CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => handleLabelDelete(label.id)}>
                  Delete
                </CustomMenu.MenuItem>
              </CustomMenu>
            </div>
          </div>
        ) : null
      ) : (
        <Disclosure as="div" className="relative z-20 rounded-md border p-3 text-gray-900 md:w-2/3">
          {({ open }) => (
            <>
              <div className="flex items-center justify-between gap-2 cursor-pointer">
                <Disclosure.Button>
                  <div className="flex items-center gap-2">
                    <span>
                      <ChevronDownIcon
                        className={`h-4 w-4 text-gray-500 ${!open ? "-rotate-90 transform" : ""}`}
                      />
                    </span>
                    <h6 className="text-sm">{label.name}</h6>
                  </div>
                </Disclosure.Button>
                <CustomMenu ellipsis>
                  <CustomMenu.MenuItem onClick={() => setLabelsListModal(true)}>
                    Add more labels
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={() => editLabel(label)}>Edit</CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={() => handleLabelDelete(label.id)}>
                    Delete
                  </CustomMenu.MenuItem>
                </CustomMenu>
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
                  <div className="mt-2 ml-4">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="group pl-4 py-1 flex items-center justify-between rounded text-sm hover:bg-gray-100"
                      >
                        <h5 className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor: child.color,
                            }}
                          />
                          {child.name}
                        </h5>
                        <div className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                          <CustomMenu ellipsis>
                            <CustomMenu.MenuItem onClick={() => removeFromGroup(child)}>
                              Remove from group
                            </CustomMenu.MenuItem>
                            <CustomMenu.MenuItem onClick={() => editLabel(child)}>
                              Edit
                            </CustomMenu.MenuItem>
                            <CustomMenu.MenuItem onClick={() => handleLabelDelete(child.id)}>
                              Delete
                            </CustomMenu.MenuItem>
                          </CustomMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      )}
    </>
  );
};
