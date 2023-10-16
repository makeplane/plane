import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Combobox, Dialog, Transition } from "@headlessui/react";
// icons
import { RectangleStackIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
// services
import { IssueLabelService } from "services/issue";
// types
import { IUser, IIssueLabels } from "types";
// constants
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  parent: IIssueLabels | undefined;
  user: IUser | undefined;
};

const issueLabelService = new IssueLabelService();

export const LabelsListModal: React.FC<Props> = ({ isOpen, handleClose, parent, user }) => {
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: issueLabels, mutate } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issueLabelService.getProjectIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const filteredLabels: IIssueLabels[] =
    query === ""
      ? issueLabels ?? []
      : issueLabels?.filter((l) => l.name.toLowerCase().includes(query.toLowerCase())) ?? [];

  const handleModalClose = () => {
    handleClose();
    setQuery("");
  };

  const addChildLabel = async (label: IIssueLabels) => {
    if (!workspaceSlug || !projectId) return;

    mutate(
      (prevData: any) =>
        prevData?.map((l: any) => {
          if (l.id === label.id) return { ...l, parent: parent?.id ?? "" };

          return l;
        }),
      false
    );

    await issueLabelService
      .patchIssueLabel(
        workspaceSlug as string,
        projectId as string,
        label.id,
        {
          parent: parent?.id ?? "",
        },
        user
      )
      .then(() => mutate());
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
      <Dialog as="div" className="relative z-20" onClose={handleModalClose}>
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

        <div className="fixed inset-0 z-20 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative mx-auto max-w-2xl transform rounded-xl border border-custom-border-200 bg-custom-background-100 shadow-2xl transition-all">
              <Combobox>
                <div className="relative m-1">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-custom-text-100 text-opacity-40"
                    aria-hidden="true"
                  />
                  <Combobox.Input
                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-custom-text-100 outline-none focus:ring-0 sm:text-sm"
                    placeholder="Search..."
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <Combobox.Options static className="max-h-80 scroll-py-2 overflow-y-auto">
                  {filteredLabels.length > 0 && (
                    <li className="p-2">
                      {query === "" && (
                        <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-custom-text-100">Labels</h2>
                      )}
                      <ul className="text-sm text-gray-700">
                        {filteredLabels.map((label) => {
                          const children = issueLabels?.filter((l) => l.parent === label.id);

                          if (
                            (label.parent === "" || label.parent === null) && // issue does not have any other parent
                            label.id !== parent?.id && // issue is not itself
                            children?.length === 0 // issue doesn't have any othe children
                          )
                            return (
                              <Combobox.Option
                                key={label.id}
                                value={{
                                  name: label.name,
                                }}
                                className={({ active }) =>
                                  `flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-custom-text-200 ${
                                    active ? "bg-custom-background-80 text-custom-text-100" : ""
                                  }`
                                }
                                onClick={() => {
                                  addChildLabel(label);
                                  handleClose();
                                }}
                              >
                                <span
                                  className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: label.color !== "" ? label.color : "#000000",
                                  }}
                                />
                                {label.name}
                              </Combobox.Option>
                            );
                        })}
                      </ul>
                    </li>
                  )}
                </Combobox.Options>

                {query !== "" && filteredLabels.length === 0 && (
                  <div className="py-14 px-6 text-center sm:px-14">
                    <RectangleStackIcon
                      className="mx-auto h-6 w-6 text-custom-text-100 text-opacity-40"
                      aria-hidden="true"
                    />
                    <p className="mt-4 text-sm text-custom-text-100">
                      We couldn{"'"}t find any label with that term. Please try again.
                    </p>
                  </div>
                )}
              </Combobox>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
