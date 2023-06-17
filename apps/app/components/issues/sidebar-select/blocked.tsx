import React, { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// react-hook-form
import { SubmitHandler, useForm, UseFormWatch } from "react-hook-form";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
// services
import projectService from "services/project.service";
// hooks
import useDebounce from "hooks/use-debounce";
import useProjectDetails from "hooks/use-project-details";
// ui
import { Loader, PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { BlockedIcon, LayerDiagonalIcon } from "components/icons";
// types
import { BlockeIssue, IIssue, ISearchIssueResponse, UserAuth } from "types";

type FormInput = {
  blocked_issues_list: BlockeIssue[];
};

type Props = {
  issueId?: string;
  submitChanges: (formData: Partial<IIssue>) => void;
  watch: UseFormWatch<IIssue>;
  userAuth: UserAuth;
};

export const SidebarBlockedSelect: React.FC<Props> = ({
  issueId,
  submitChanges,
  watch,
  userAuth,
}) => {
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm: string = useDebounce(searchTerm, 500);

  const { setToastAlert } = useToast();
  const { projectDetails } = useProjectDetails();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    handleSubmit,
    reset,
    watch: watchBlocked,
    setValue,
  } = useForm<FormInput>({
    defaultValues: {
      blocked_issues_list: [],
    },
  });

  const handleClose = () => {
    setIsBlockedModalOpen(false);
    setSearchTerm("");
    reset();
  };

  const onSubmit: SubmitHandler<FormInput> = (data) => {
    if (!data.blocked_issues_list || data.blocked_issues_list.length === 0) {
      setToastAlert({
        title: "Error",
        type: "error",
        message: "Please select at least one issue",
      });
      return;
    }

    if (!Array.isArray(data.blocked_issues_list))
      data.blocked_issues_list = [data.blocked_issues_list];

    const newBlocked = [...watch("blocked_issues"), ...data.blocked_issues_list];
    submitChanges({
      blocked_issues: newBlocked,
      blocks_list: newBlocked.map((i) => i.blocked_issue_detail?.id ?? ""),
    });
    handleClose();
  };

  useEffect(() => {
    if (!workspaceSlug || !projectId) return;

    setIsLoading(true);

    if (debouncedSearchTerm) {
      setIsSearching(true);

      projectService
        .projectIssuesSearch(workspaceSlug as string, projectId as string, {
          search: debouncedSearchTerm,
          blocker_blocked_by: true,
          issue_id: issueId,
        })
        .then((res) => {
          setIssues(res);
        })
        .finally(() => {
          setIsLoading(false);
          setIsSearching(false);
        });
    } else {
      setIssues([]);
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm, workspaceSlug, projectId, issueId]);

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div className="flex flex-wrap items-start py-2">
      <div className="flex items-center gap-x-2 text-sm text-brand-secondary sm:basis-1/2">
        <BlockedIcon height={16} width={16} />
        <p>Blocked by</p>
      </div>
      <div className="space-y-1 sm:basis-1/2">
        <div className="flex flex-wrap gap-1">
          {watch("blocked_issues") && watch("blocked_issues").length > 0
            ? watch("blocked_issues").map((issue) => (
                <div
                  key={issue.blocked_issue_detail?.id}
                  className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-brand-base px-1.5 py-0.5 text-xs text-red-500 duration-300 hover:border-red-500/20 hover:bg-red-500/20"
                >
                  <Link
                    href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.blocked_issue_detail?.id}`}
                  >
                    <a className="flex items-center gap-1">
                      <BlockedIcon height={10} width={10} />
                      {`${projectDetails?.identifier}-${issue.blocked_issue_detail?.sequence_id}`}
                    </a>
                  </Link>
                  <button
                    type="button"
                    className="opacity-0 duration-300 group-hover:opacity-100"
                    onClick={() => {
                      const updatedBlocked = watch("blocked_issues").filter(
                        (i) => i.blocked_issue_detail?.id !== issue.blocked_issue_detail?.id
                      );

                      submitChanges({
                        blocked_issues: updatedBlocked,
                        blocks_list: updatedBlocked.map((i) => i.blocked_issue_detail?.id ?? ""),
                      });
                    }}
                  >
                    <XMarkIcon className="h-2 w-2" />
                  </button>
                </div>
              ))
            : null}
        </div>
        <Transition.Root
          show={isBlockedModalOpen}
          as={React.Fragment}
          afterLeave={() => setSearchTerm("")}
          appear
        >
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
                  <form>
                    <Combobox
                      onChange={(val: ISearchIssueResponse) => {
                        const selectedIssues = watchBlocked("blocked_issues_list");

                        if (selectedIssues.some((i) => i.blocked_issue_detail?.id === val.id))
                          setValue(
                            "blocked_issues_list",
                            selectedIssues.filter((i) => i.blocked_issue_detail?.id !== val.id)
                          );
                        else
                          setValue("blocked_issues_list", [
                            ...selectedIssues,
                            {
                              blocked_issue_detail: {
                                id: val.id,
                                name: val.name,
                                sequence_id: val.sequence_id,
                              },
                            },
                          ]);
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
                          placeholder="Type to search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <Combobox.Options
                        static
                        className="max-h-80 scroll-py-2 divide-y divide-brand-base overflow-y-auto"
                      >
                        {!isLoading &&
                          issues.length === 0 &&
                          searchTerm !== "" &&
                          debouncedSearchTerm !== "" && (
                            <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                              <LayerDiagonalIcon height="52" width="52" />
                              <h3 className="text-brand-secondary">
                                No issues found. Create a new issue with{" "}
                                <pre className="inline rounded bg-brand-surface-2 px-2 py-1 text-sm">
                                  C
                                </pre>
                                .
                              </h3>
                            </div>
                          )}

                        {isLoading || isSearching ? (
                          <Loader className="space-y-3 p-3 -mt-4">
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                          </Loader>
                        ) : (
                          <li className="p-2">
                            <ul className="text-sm text-brand-base">
                              {issues.map((issue) => (
                                <Combobox.Option
                                  key={issue.id}
                                  as="div"
                                  value={issue}
                                  className={({ active }) =>
                                    `flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-brand-secondary ${
                                      active ? "bg-brand-surface-2 text-brand-base" : ""
                                    }`
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={watchBlocked("blocked_issues_list").some(
                                        (i) => i.blocked_issue_detail?.id === issue.id
                                      )}
                                      readOnly
                                    />
                                    <span
                                      className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                      style={{
                                        backgroundColor: issue.state__color,
                                      }}
                                    />
                                    <span className="flex-shrink-0 text-xs text-brand-secondary">
                                      {issue.project__identifier}-{issue.sequence_id}
                                    </span>
                                    <span>{issue.name}</span>
                                  </div>
                                </Combobox.Option>
                              ))}
                            </ul>
                          </li>
                        )}
                      </Combobox.Options>
                    </Combobox>

                    {issues.length > 0 && (
                      <div className="flex items-center justify-end gap-2 p-3">
                        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                        <PrimaryButton onClick={handleSubmit(onSubmit)}>
                          Add selected issues
                        </PrimaryButton>
                      </div>
                    )}
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
        <button
          type="button"
          className={`flex w-full text-brand-secondary ${
            isNotAllowed ? "cursor-not-allowed" : "cursor-pointer hover:bg-brand-surface-2"
          } items-center justify-between gap-1 rounded-md border border-brand-base px-2 py-1 text-xs shadow-sm duration-300 focus:outline-none`}
          onClick={() => setIsBlockedModalOpen(true)}
          disabled={isNotAllowed}
        >
          Select issues
        </button>
      </div>
    </div>
  );
};
