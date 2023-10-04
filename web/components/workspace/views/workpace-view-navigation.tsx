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
  const { workspaceSlug, globalViewId } = router.query;

  const { data: workspaceViews } = useSWR(
    workspaceSlug ? WORKSPACE_VIEWS_LIST(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.getAllViews(workspaceSlug.toString()) : null
  );

  const isSelected = (pathName: string) => router.pathname.includes(pathName);
  React.useEffect(() => {
    const activeTabElement = document.getElementById("active-tab-global-view");
    if (activeTabElement) activeTabElement.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, [globalViewId, workspaceViews]);

  const tabsList = [
    {
      key: "all",
      label: "All Issues",
      selected: isSelected("workspace-views/all-issues"),
      onClick: () => router.replace(`/${workspaceSlug}/workspace-views/all-issues`),
    },
    {
      key: "assigned",
      label: "Assigned",
      selected: isSelected("workspace-views/assigned"),
      onClick: () => router.replace(`/${workspaceSlug}/workspace-views/assigned`),
    },
    {
      key: "created",
      label: "Created",
      selected: isSelected("workspace-views/created"),
      onClick: () => router.replace(`/${workspaceSlug}/workspace-views/created`),
    },
    {
      key: "subscribed",
      label: "Subscribed",
      selected: isSelected("workspace-views/subscribed"),
      onClick: () => router.replace(`/${workspaceSlug}/workspace-views/subscribed`),
    },
  ];

  return (
    <div className="group flex items-center gap-x-1 overflow-x-scroll relative">
      {tabsList.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={tab.onClick}
          className={`border-b-2 min-w-min p-3 text-sm font-medium outline-none whitespace-nowrap flex-shrink-0 ${
            tab.selected
              ? "border-custom-primary-100 text-custom-primary-100"
              : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
          }`}
          id={tab.selected ? `active-tab-global-view` : ``}
        >
          {tab.label}
        </button>
      ))}

      {workspaceViews &&
        workspaceViews.length > 0 &&
        workspaceViews?.map((view) => (
          <button
            className={`border-b-2 min-w-min p-3 text-sm font-medium outline-none whitespace-nowrap flex-shrink-0 ${
              view.id === globalViewId
                ? "border-custom-primary-100 text-custom-primary-100"
                : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
            }`}
            id={view.id === globalViewId ? `active-tab-global-view` : ``}
            onClick={() =>
              router.replace(`/${workspaceSlug}/workspace-views/issues?globalViewId=${view.id}`)
            }
          >
            {view.name}
          </button>
        ))}

      <button
        type="button"
        className="flex items-center justify-center flex-shrink-0 sticky right-0 w-12 py-3 border-transparent bg-custom-background-100 hover:border-custom-border-200 hover:text-custom-text-400"
        onClick={handleAddView}
      >
        <PlusIcon className="h-4 w-4 text-custom-primary-200" />
      </button>
    </div>
  );
};
