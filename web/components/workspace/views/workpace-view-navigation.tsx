import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// icon
import { PlusIcon } from "lucide-react";
// constant
import { WORKSPACE_VIEWS_LIST } from "constants/fetch-keys";
// service
import workspaceService from "services/workspace.service";

type Props = {
  handleAddView: () => void;
};

export const WorkspaceViewsNavigation: React.FC<Props> = ({ handleAddView }) => {
  const router = useRouter();
  const { workspaceSlug, workspaceViewId } = router.query;

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

  return (
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

      <button type="button" className="min-w-[96px] " onClick={handleAddView}>
        <PlusIcon className="h-4 w-4 text-custom-primary-200 hover:text-current" />
      </button>
    </div>
  );
};
