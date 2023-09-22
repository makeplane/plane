import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// hooks
import useMyIssuesFilters from "hooks/my-issues/use-my-issues-filter";
import useToast from "hooks/use-toast";
// components
import { FiltersList } from "components/core";
import { PrimaryButton } from "components/ui";
import { CreateUpdateViewModal } from "components/views";
// icon
import { PlusIcon } from "lucide-react";
// constant
import { WORKSPACE_VIEWS_LIST } from "constants/fetch-keys";
// service
import workspaceService from "services/workspace.service";
// type
import { ICurrentUserResponse, IIssueFilterOptions } from "types";

type Props = {
  user: ICurrentUserResponse | undefined;
};

export const WorkspaceViewsNavigation: React.FC<Props> = ({ user }) => {
  const [createViewModal, setCreateViewModal] = useState<any>(null);

  const router = useRouter();
  const { workspaceSlug, workspaceViewId } = router.query;

  const { setToastAlert } = useToast();

  const { filters, setFilters } = useMyIssuesFilters(workspaceSlug?.toString());

  const { data: workspaceViews } = useSWR(
    workspaceSlug ? WORKSPACE_VIEWS_LIST(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.getAllViews(workspaceSlug.toString()) : null
  );

  const isSelected = (pathName: string) => router.pathname.includes(pathName);

  const tabsList = [
    {
      key: "all",
      label: "All Issues",
      selected: isSelected("workspace-views/all-issues"),
      onClick: () => router.push(`/${workspaceSlug}/workspace-views/all-issues`),
    },
    {
      key: "assigned",
      label: "Assigned",
      selected: isSelected("workspace-views/assigned"),
      onClick: () => router.push(`/${workspaceSlug}/workspace-views/assigned`),
    },
    {
      key: "created",
      label: "Created",
      selected: isSelected("workspace-views/created"),
      onClick: () => router.push(`/${workspaceSlug}/workspace-views/created`),
    },
    {
      key: "subscribed",
      label: "Subscribed",
      selected: isSelected("workspace-views/subscribed"),
      onClick: () => router.push(`/${workspaceSlug}/workspace-views/subscribed`),
    },
  ];

  const nullFilters = Object.keys(filters).filter(
    (key) => filters[key as keyof IIssueFilterOptions] === null
  );

  const areFiltersApplied =
    Object.keys(filters).length > 0 && nullFilters.length !== Object.keys(filters).length;

  return (
    <>
      <CreateUpdateViewModal
        isOpen={createViewModal !== null}
        handleClose={() => setCreateViewModal(null)}
        viewType="workspace"
        preLoadedData={createViewModal}
        user={user}
      />
      <div className="group flex items-center overflow-x-scroll">
        {tabsList.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={tab.onClick}
            className={`border-b-2 min-w-[96px] p-4 text-sm font-medium outline-none whitespace-nowrap ${
              tab.selected
                ? "border-custom-primary-100 text-custom-primary-100"
                : "border-transparent hover:border-custom-primary-100 hover:text-custom-primary-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {workspaceViews &&
          workspaceViews.length > 0 &&
          workspaceViews?.map((view) => (
            <button
              className={`border-b-2 min-w-[96px] p-4 text-sm font-medium outline-none whitespace-nowrap ${
                view.id === workspaceViewId
                  ? "border-custom-primary-100 text-custom-primary-100"
                  : "border-transparent hover:border-custom-primary-100 hover:text-custom-primary-100"
              }`}
              onClick={() => router.push(`/${workspaceSlug}/workspace-views/${view.id}`)}
            >
              {view.name}
            </button>
          ))}

        <button type="button" className="min-w-[96px] " onClick={() => setCreateViewModal(true)}>
          <PlusIcon className="h-4 w-4 text-custom-primary-200 hover:text-current" />
        </button>
      </div>
      {areFiltersApplied && (
        <>
          <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-0">
            <FiltersList
              filters={filters}
              setFilters={(updatedFilter) => setFilters(updatedFilter)}
              labels={[]}
              members={[]}
              states={[]}
              clearAllFilters={() =>
                setFilters({
                  assignees: null,
                  created_by: null,
                  labels: null,
                  priority: null,
                  state: null,
                  start_date: null,
                  target_date: null,
                })
              }
            />
            <PrimaryButton
              onClick={() => {
                if (workspaceViewId) {
                  setFilters({});
                  setToastAlert({
                    title: "View updated",
                    message: "Your view has been updated",
                    type: "success",
                  });
                } else
                  setCreateViewModal({
                    query: filters,
                  });
              }}
              className="flex items-center gap-2 text-sm"
            >
              {!workspaceViewId && <PlusIcon className="h-4 w-4" />}
              {workspaceViewId ? "Update" : "Save"} view
            </PrimaryButton>
          </div>
          {<div className="mt-3 border-t border-custom-border-200" />}
        </>
      )}
    </>
  );
};
