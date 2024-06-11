"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { FileText, Inbox } from "lucide-react";
// types
import { IProject } from "@plane/types";
// ui
import { ContrastIcon, DiceIcon, PhotoFilterIcon, ToggleSwitch, setPromiseToast } from "@plane/ui";
// hooks
import { useEventTracker, useProject, useUser } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

const PROJECT_FEATURES_LIST = [
  {
    title: "Cycles",
    description: "Time-box issues and boost momentum, similar to sprints in scrum.",
    icon: <ContrastIcon className="h-4 w-4 flex-shrink-0 rotate-180 text-purple-500" />,
    property: "cycle_view",
  },
  {
    title: "Modules",
    description: "Group multiple issues together and track the progress.",
    icon: <DiceIcon width={16} height={16} className="flex-shrink-0 text-red-500" />,
    property: "module_view",
  },
  {
    title: "Views",
    description: "Apply filters to issues and save them to analyse and investigate work.",
    icon: <PhotoFilterIcon className="h-4 w-4 flex-shrink-0 text-cyan-500" />,
    property: "issue_views_view",
  },
  {
    title: "Pages",
    description: "Document ideas, feature requirements, discussions within your project.",
    icon: <FileText className="h-4 w-4 flex-shrink-0 text-red-400" />,
    property: "page_view",
  },
  {
    title: "Inbox",
    description: "Capture external inputs, move valid issues to workflow.",
    icon: <Inbox className="h-4 w-4 flex-shrink-0 text-fuchsia-500" />,
    property: "inbox_view",
  },
];

export const ProjectFeaturesList: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, isAdmin } = props;
  // store hooks
  const { captureEvent } = useEventTracker();
  const { data: currentUser } = useUser();
  const { getProjectById, updateProject } = useProject();
  // derived values
  const currentProjectDetails = getProjectById(projectId);

  const handleSubmit = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId || !currentProjectDetails) return;
    const updateProjectPromise = updateProject(workspaceSlug, projectId, formData);
    setPromiseToast(updateProjectPromise, {
      loading: "Updating project feature...",
      success: {
        title: "Success!",
        message: () => "Project feature updated successfully.",
      },
      error: {
        title: "Error!",
        message: () => "Something went wrong while updating project feature. Please try again.",
      },
    });
  };

  if (!currentUser) return <></>;

  return (
    <div className="mx-4">
      {PROJECT_FEATURES_LIST.map((feature) => (
        <div
          key={feature.property}
          className="flex items-center justify-between gap-x-8 gap-y-2 border-b border-custom-border-100 bg-custom-background-100 pb-2 pt-4 last:border-b-0"
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded bg-custom-primary-50/10 p-3">{feature.icon}</div>
            <div className="">
              <h4 className="text-sm font-medium leading-5">{feature.title}</h4>
              <p className="text-sm leading-5 tracking-tight text-custom-text-300">{feature.description}</p>
            </div>
          </div>
          <ToggleSwitch
            value={Boolean(currentProjectDetails?.[feature.property as keyof IProject])}
            onChange={() => {
              captureEvent(`Toggle ${feature.title.toLowerCase()}`, {
                enabled: !currentProjectDetails?.[feature.property as keyof IProject],
                element: "Project settings feature page",
              });
              handleSubmit({
                [feature.property]: !currentProjectDetails?.[feature.property as keyof IProject],
              });
            }}
            disabled={!isAdmin}
            size="sm"
          />
        </div>
      ))}
    </div>
  );
});
