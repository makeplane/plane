import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { SubmitHandler, useForm, UseFormWatch } from "react-hook-form";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
// services
import issuesServices from "services/issues.service";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// fetch-keys
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  value?: string | null;
  onClose: () => void;
  onSubmit: (issueId: string) => void;
};

export const SelectDuplicateInboxIssueModal: React.FC<Props> = (props) => {
  const { isOpen, onClose, onSubmit, value } = props;

  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<string>("");

  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () =>
          issuesServices
            .getIssues(workspaceSlug as string, projectId as string)
            .then((res) => res.filter((issue) => issue.id !== issueId))
      : null
  );

  useEffect(() => {
    if (!value) {
      setSelectedItem("");
      return;
    } else setSelectedItem(value);
  }, [value]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedItem || selectedItem.length === 0)
      return setToastAlert({
        title: "Error",
        type: "error",
      });
    onSubmit(selectedItem);
    handleClose();
  };

  const filteredIssues =
    (query === "" ? issues : issues?.filter((issue) => issue.name.includes(query))) ?? [];

  return (
    <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
      <div className="flex flex-wrap items-start py-2">
        <div className="space-y-1 sm:basis-1/2">
          <Dialog as="div" className="relative z-20" onClose={handleClose}>
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
                <Dialog.Panel className="relative mx-auto max-w-2xl transform rounded-xl border border-brand-base bg-brand-base shadow-2xl transition-all">
                  <Combobox
                    value={selectedItem}
                    onChange={(value) => {
                      setSelectedItem(value);
                    }}
                  >
                    <div className="relative m-1">
                      <MagnifyingGlassIcon
                        className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-brand-base text-opacity-40"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-brand-base placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
                        placeholder="Search..."
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>

                    <Combobox.Options
                      static
                      className="max-h-80 scroll-py-2 divide-y divide-brand-base overflow-y-auto"
                    >
                      {filteredIssues.length > 0 ? (
                        <li className="p-2">
                          {query === "" && (
                            <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-brand-base">
                              Select issue
                            </h2>
                          )}
                          <ul className="text-sm text-brand-base">
                            {filteredIssues.map((issue) => (
                              <Combobox.Option
                                key={issue.id}
                                as="div"
                                value={issue.id}
                                className={({ active, selected }) =>
                                  `flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-brand-secondary ${
                                    active || selected ? "bg-brand-surface-2 text-brand-base" : ""
                                  } `
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: issue.state_detail.color,
                                    }}
                                  />
                                  <span className="flex-shrink-0 text-xs text-brand-secondary">
                                    {
                                      issues?.find((i) => i.id === issue.id)?.project_detail
                                        ?.identifier
                                    }
                                    -{issue.sequence_id}
                                  </span>
                                  <span className="text-brand-muted-1">{issue.name}</span>
                                </div>
                              </Combobox.Option>
                            ))}
                          </ul>
                        </li>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                          <LayerDiagonalIcon height="56" width="56" />
                          <h3 className="text-sm text-brand-secondary">
                            No issues found. Create a new issue with{" "}
                            <pre className="inline rounded bg-brand-surface-2 px-2 py-1">C</pre>.
                          </h3>
                        </div>
                      )}
                    </Combobox.Options>
                  </Combobox>

                  {filteredIssues.length > 0 && (
                    <div className="flex items-center justify-end gap-2 p-3">
                      <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                      <PrimaryButton onClick={handleSubmit}>Mark as original</PrimaryButton>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </div>
      </div>
    </Transition.Root>
  );
};
