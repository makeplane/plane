import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
import { SubmitHandler, useForm } from "react-hook-form";
import { Combobox, Dialog, Transition } from "@headlessui/react";
// services
import { IssueService } from "services/issue";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, LayersIcon } from "@plane/ui";
// icons
import { Search } from "lucide-react";
// types
import { IUser, TIssue } from "@plane/types";
// fetch keys
import { PROJECT_ISSUES_LIST } from "constants/fetch-keys";
// store hooks
import { useIssues, useProject } from "hooks/store";
// components
import { BulkDeleteIssuesModalItem } from "./bulk-delete-issues-modal-item";
// constants
import { EIssuesStoreType } from "constants/issue";

type FormInput = {
  delete_issue_ids: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: IUser | undefined;
};

const issueService = new IssueService();

export const BulkDeleteIssuesModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // hooks
  const { getProjectById } = useProject();
  const {
    issues: { removeBulkIssues },
  } = useIssues(EIssuesStoreType.PROJECT);
  // states
  const [query, setQuery] = useState("");
  // fetching project issues.
  const { data: issues } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string) : null,
    workspaceSlug && projectId ? () => issueService.getIssues(workspaceSlug as string, projectId as string) : null
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

  const handleClose = () => {
    setQuery("");
    reset();
    onClose();
  };

  const handleDelete: SubmitHandler<FormInput> = async (data) => {
    if (!workspaceSlug || !projectId) return;

    if (!data.delete_issue_ids || data.delete_issue_ids.length === 0) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please select at least one issue.",
      });
      return;
    }

    if (!Array.isArray(data.delete_issue_ids)) data.delete_issue_ids = [data.delete_issue_ids];

    await removeBulkIssues(workspaceSlug as string, projectId as string, data.delete_issue_ids)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Issues deleted successfully!",
        });
        handleClose();
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      );
  };

  const projectDetails = getProjectById(projectId as string);

  const filteredIssues: TIssue[] =
    query === ""
      ? Object.values(issues ?? {})
      : Object.values(issues ?? {})?.filter(
          (issue) =>
            issue.name.toLowerCase().includes(query.toLowerCase()) ||
            `${projectDetails?.identifier}-${issue.sequence_id}`.toLowerCase().includes(query.toLowerCase())
        ) ?? [];

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
                      {filteredIssues.length > 0 ? (
                        <li className="p-2">
                          {query === "" && (
                            <h2 className="mb-2 mt-4 px-3 text-xs font-semibold text-custom-text-100">
                              Select issues to delete
                            </h2>
                          )}
                          <ul className="text-sm text-custom-text-200">
                            {filteredIssues.map((issue) => (
                              <BulkDeleteIssuesModalItem
                                issue={issue}
                                identifier={projectDetails?.identifier}
                                delete_issue_ids={watch("delete_issue_ids").includes(issue.id)}
                                key={issue.id}
                              />
                            ))}
                          </ul>
                        </li>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                          <LayersIcon height="56" width="56" />
                          <h3 className="text-custom-text-200">
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
