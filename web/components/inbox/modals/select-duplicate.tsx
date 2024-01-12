import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Combobox, Dialog, Transition } from "@headlessui/react";

// hooks
import useToast from "hooks/use-toast";
// services
import { IssueService } from "services/issue";
// ui
import { Button, LayersIcon } from "@plane/ui";
// icons
import { Search } from "lucide-react";
// fetch-keys
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";
import { useProject, useProjectState } from "hooks/store";

type Props = {
  isOpen: boolean;
  value?: string | null;
  onClose: () => void;
  onSubmit: (issueId: string) => void;
};

const issueService = new IssueService();

export const SelectDuplicateInboxIssueModal: React.FC<Props> = (props) => {
  const { isOpen, onClose, onSubmit, value } = props;

  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<string>("");

  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  // hooks
  const { getProjectStates } = useProjectState();
  const { getProjectById } = useProject();

  const { data: issues } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string) : null,
    workspaceSlug && projectId
      ? () =>
          issueService
            .getIssues(workspaceSlug as string, projectId as string)
            .then((res) => Object.values(res ?? {}).filter((issue) => issue.id !== issueId))
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

  const filteredIssues = (query === "" ? issues : issues?.filter((issue) => issue.name.includes(query))) ?? [];

  return (
    <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
      <div className="flex flex-wrap items-start">
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
              <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
                <Dialog.Panel className="relative mx-auto max-w-2xl transform rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
                  <Combobox
                    value={selectedItem}
                    onChange={(value) => {
                      setSelectedItem(value);
                    }}
                  >
                    <div className="relative m-1">
                      <Search
                        className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-custom-text-100 text-opacity-40"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-custom-text-100 outline-none focus:ring-0 sm:text-sm"
                        placeholder="Search..."
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>

                    <Combobox.Options
                      static
                      className="max-h-80 scroll-py-2 divide-y divide-custom-border-200 overflow-y-auto"
                    >
                      {filteredIssues.length > 0 ? (
                        <li className="p-2">
                          {query === "" && (
                            <h2 className="mb-2 mt-4 px-3 text-xs font-semibold text-custom-text-100">Select issue</h2>
                          )}
                          <ul className="text-sm text-custom-text-100">
                            {filteredIssues.map((issue) => {
                              const stateColor =
                                getProjectStates(issue?.project_id)?.find((state) => state?.id == issue?.state_id)
                                  ?.color || "";

                              return (
                                <Combobox.Option
                                  key={issue.id}
                                  as="div"
                                  value={issue.id}
                                  className={({ active, selected }) =>
                                    `flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-custom-text-200 ${
                                      active || selected ? "bg-custom-background-80 text-custom-text-100" : ""
                                    } `
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                      style={{
                                        backgroundColor: stateColor,
                                      }}
                                    />
                                    <span className="flex-shrink-0 text-xs text-custom-text-200">
                                      {getProjectById(issue?.project_id)?.identifier}-{issue.sequence_id}
                                    </span>
                                    <span className="text-custom-text-200">{issue.name}</span>
                                  </div>
                                </Combobox.Option>
                              );
                            })}
                          </ul>
                        </li>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                          <LayersIcon height="56" width="56" />
                          <h3 className="text-sm text-custom-text-200">
                            No issues found. Create a new issue with{" "}
                            <pre className="inline rounded bg-custom-background-80 px-2 py-1">C</pre>.
                          </h3>
                        </div>
                      )}
                    </Combobox.Options>
                  </Combobox>

                  {filteredIssues.length > 0 && (
                    <div className="flex items-center justify-end gap-2 p-3">
                      <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSubmit}>
                        Mark as original
                      </Button>
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
