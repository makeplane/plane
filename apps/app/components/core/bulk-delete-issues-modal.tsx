import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react hook form
import { SubmitHandler, useForm } from "react-hook-form";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// services
import issuesServices from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button } from "components/ui";
// icons
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// types
import { IIssue, IssueResponse } from "types";
// fetch keys
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";

type FormInput = {
  delete_issue_ids: string[];
};

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const BulkDeleteIssuesModal: React.FC<Props> = ({ isOpen, setIsOpen }) => {
  const [query, setQuery] = useState("");

  const router = useRouter();

  const {
    query: { workspaceSlug, projectId },
  } = router;

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesServices.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const { setToastAlert } = useToast();

  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormInput>({
    defaultValues: {
      delete_issue_ids: [],
    },
  });

  const filteredIssues: IIssue[] =
    query === ""
      ? issues?.results ?? []
      : issues?.results.filter(
          (issue) =>
            issue.name.toLowerCase().includes(query.toLowerCase()) ||
            `${issue.project_detail.identifier}-${issue.sequence_id}`
              .toLowerCase()
              .includes(query.toLowerCase())
        ) ?? [];

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    reset();
  };

  const handleDelete: SubmitHandler<FormInput> = async (data) => {
    if (!data.delete_issue_ids || data.delete_issue_ids.length === 0) {
      setToastAlert({
        title: "Error",
        type: "error",
        message: "Please select atleast one issue",
      });
      return;
    }

    if (!Array.isArray(data.delete_issue_ids)) data.delete_issue_ids = [data.delete_issue_ids];

    if (workspaceSlug && projectId) {
      await issuesServices
        .bulkDeleteIssues(workspaceSlug as string, projectId as string, {
          issue_ids: data.delete_issue_ids,
        })
        .then((res) => {
          setToastAlert({
            title: "Success",
            type: "success",
            message: res.message,
          });

          mutate<IssueResponse>(
            PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
            (prevData) => ({
              ...(prevData as IssueResponse),
              count: (prevData?.results ?? []).filter(
                (p) => !data.delete_issue_ids.some((id) => p.id === id)
              ).length,
              results: (prevData?.results ?? []).filter(
                (p) => !data.delete_issue_ids.some((id) => p.id === id)
              ),
            }),
            false
          );
          handleClose();
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
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
            <Dialog.Panel className="relative mx-auto max-w-2xl transform divide-y divide-gray-500 divide-opacity-10 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              <form>
                <Combobox
                  onChange={(val: string) => {
                    const selectedIssues = watch("delete_issue_ids");
                    if (selectedIssues.includes(val))
                      setValue(
                        "delete_issue_ids",
                        selectedIssues.filter((i) => i !== val)
                      );
                    else {
                      const newToDelete = selectedIssues;
                      newToDelete.push(val);

                      setValue("delete_issue_ids", newToDelete);
                    }
                  }}
                >
                  <div className="relative m-1">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-900 text-opacity-40"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
                      placeholder="Search..."
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>

                  <Combobox.Options
                    static
                    className="max-h-80 scroll-py-2 divide-y divide-gray-500 divide-opacity-10 overflow-y-auto"
                  >
                    {filteredIssues.length > 0 ? (
                      <li className="p-2">
                        {query === "" && (
                          <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-900">
                            Select issues to delete
                          </h2>
                        )}
                        <ul className="text-sm text-gray-700">
                          {filteredIssues.map((issue) => (
                            <Combobox.Option
                              key={issue.id}
                              as="div"
                              value={issue.id}
                              className={({ active }) =>
                                `flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 ${
                                  active ? "bg-gray-900 bg-opacity-5 text-gray-900" : ""
                                }`
                              }
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={watch("delete_issue_ids").includes(issue.id)}
                                  readOnly
                                />
                                <span
                                  className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: issue.state_detail.color,
                                  }}
                                />
                                <span className="flex-shrink-0 text-xs text-gray-500">
                                  {issue.project_detail.identifier}-{issue.sequence_id}
                                </span>
                                <span>{issue.name}</span>
                              </div>
                            </Combobox.Option>
                          ))}
                        </ul>
                      </li>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                        <LayerDiagonalIcon height="56" width="56" />
                        <h3 className="text-gray-500">
                          No issues found. Create a new issue with{" "}
                          <pre className="inline rounded bg-gray-100 px-2 py-1">C</pre>.
                        </h3>
                      </div>
                    )}
                  </Combobox.Options>
                </Combobox>

                {filteredIssues.length > 0 && (
                  <div className="flex items-center justify-end gap-2 p-3">
                    <Button type="button" theme="secondary" size="sm" onClick={handleClose}>
                      Close
                    </Button>
                    <Button
                      onClick={handleSubmit(handleDelete)}
                      theme="danger"
                      size="sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Deleting..." : "Delete selected issues"}
                    </Button>
                  </div>
                )}
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
