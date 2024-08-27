"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { Combobox, Dialog, Transition } from "@headlessui/react";
// types
import { ISearchIssueResponse, IUser } from "@plane/types";
// ui
import { Button, Loader, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EmptyState } from "@/components/empty-state";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EIssuesStoreType } from "@/constants/issue";
// hooks
import { useIssues } from "@/hooks/store";
import useDebounce from "@/hooks/use-debounce";
// services
import { ProjectService } from "@/services/project";
// local components
import { BulkDeleteIssuesModalItem } from "./bulk-delete-issues-modal-item";

type FormInput = {
  delete_issue_ids: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: IUser | undefined;
};

const projectService = new ProjectService();

export const BulkDeleteIssuesModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose } = props;
  // router params
  const { workspaceSlug, projectId } = useParams();
  // hooks
  const {
    issues: { removeBulkIssues },
  } = useIssues(EIssuesStoreType.PROJECT);
  // states
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearchTerm: string = useDebounce(query, 500);

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId) return;

    setIsSearching(true);
    projectService
      .projectIssuesSearch(workspaceSlug.toString(), projectId.toString(), {
        search: debouncedSearchTerm,
        workspace_search: false,
      })
      .then((res: ISearchIssueResponse[]) => setIssues(res))
      .finally(() => setIsSearching(false));
  }, [debouncedSearchTerm, isOpen, projectId, workspaceSlug]);

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

  const handleClose = () => {
    setQuery("");
    reset();
    onClose();
  };

  const handleDelete: SubmitHandler<FormInput> = async (data) => {
    if (!workspaceSlug || !projectId) return;

    if (!data.delete_issue_ids || data.delete_issue_ids.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one issue.",
      });
      return;
    }

    if (!Array.isArray(data.delete_issue_ids)) data.delete_issue_ids = [data.delete_issue_ids];

    await removeBulkIssues(workspaceSlug as string, projectId as string, data.delete_issue_ids)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Issues deleted successfully!",
        });
        handleClose();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      );
  };

  const issueList =
    issues.length > 0 ? (
      <li className="p-2">
        {query === "" && (
          <h2 className="mb-2 mt-4 px-3 text-xs font-semibold text-custom-text-100">Select issues to delete</h2>
        )}
        <ul className="text-sm text-custom-text-200">
          {issues.map((issue) => (
            <BulkDeleteIssuesModalItem
              issue={issue}
              canDeleteIssueIds={watch("delete_issue_ids").includes(issue.id)}
              key={issue.id}
            />
          ))}
        </ul>
      </li>
    ) : (
      <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
        <EmptyState
          type={
            query === "" ? EmptyStateType.ISSUE_RELATION_EMPTY_STATE : EmptyStateType.ISSUE_RELATION_SEARCH_EMPTY_STATE
          }
          layout="screen-simple"
        />
      </div>
    );

  return (
    <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <div className="fixed inset-0 z-20 overflow-y-auto bg-custom-backdrop p-4 transition-opacity sm:p-6 md:p-20">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="relative flex w-full items-center justify-center ">
              <div className="w-full max-w-2xl transform divide-y divide-custom-border-200 divide-opacity-10 rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all">
                <form>
                  <Combobox
                    onChange={(val: string) => {
                      const selectedIssues = watch("delete_issue_ids");
                      if (selectedIssues.includes(val))
                        setValue(
                          "delete_issue_ids",
                          selectedIssues.filter((i) => i !== val)
                        );
                      else setValue("delete_issue_ids", [...selectedIssues, val]);
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
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </div>

                    <Combobox.Options
                      static
                      className="max-h-80 scroll-py-2 divide-y divide-custom-border-200 overflow-y-auto"
                    >
                      {isSearching ? (
                        <Loader className="space-y-3 p-3">
                          <Loader.Item height="40px" />
                          <Loader.Item height="40px" />
                          <Loader.Item height="40px" />
                          <Loader.Item height="40px" />
                        </Loader>
                      ) : (
                        <>{issueList}</>
                      )}
                    </Combobox.Options>
                  </Combobox>

                  {issues.length > 0 && (
                    <div className="flex items-center justify-end gap-2 p-3">
                      <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button variant="danger" size="sm" onClick={handleSubmit(handleDelete)} loading={isSubmitting}>
                        {isSubmitting ? "Deleting..." : "Delete selected issues"}
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
