import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { ContrastIcon, FileText, Inbox, Layers } from "lucide-react";
import { DiceIcon, ToggleSwitch } from "@plane/ui";
// hooks
import { useApplication, useProject, useUser, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
// types
import { IProject } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";

type Props = {};

const PROJECT_FEATURES_LIST = [
  {
    title: "Cycles",
    description: "Cycles are enabled for all the projects in this workspace. Access them from the sidebar.",
    icon: <ContrastIcon className="h-4 w-4 flex-shrink-0 rotate-180 text-purple-500" />,
    property: "cycle_view",
  },
  {
    title: "Modules",
    description: "Modules are enabled for all the projects in this workspace. Access it from the sidebar.",
    icon: <DiceIcon width={16} height={16} className="flex-shrink-0" />,
    property: "module_view",
  },
  {
    title: "Views",
    description: "Views are enabled for all the projects in this workspace. Access it from the sidebar.",
    icon: <Layers className="h-4 w-4 flex-shrink-0 text-cyan-500" />,
    property: "issue_views_view",
  },
  {
    title: "Pages",
    description: "Pages are enabled for all the projects in this workspace. Access it from the sidebar.",
    icon: <FileText className="h-4 w-4 flex-shrink-0 text-red-400" />,
    property: "page_view",
  },
  {
    title: "Inbox",
    description: "Inbox are enabled for all the projects in this workspace. Access it from the issues views page.",
    icon: <Inbox className="h-4 w-4 flex-shrink-0 text-fuchsia-500" />,
    property: "inbox_view",
  },
];

export const ProjectFeaturesList: FC<Props> = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    eventTracker: { setTrackElement, postHogEventTracker },
  } = useApplication();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { currentProjectDetails, updateProject } = useProject();
  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;
  // toast alert
  const { setToastAlert } = useToast();

  const handleSubmit = async (formData: Partial<IProject>) => {
    if (!workspaceSlug || !projectId || !currentProjectDetails) return;
    setToastAlert({
      type: "success",
      title: "Success!",
      message: "Project feature updated successfully.",
    });
    updateProject(workspaceSlug.toString(), projectId.toString(), formData);
  };

  if (!currentUser) return <></>;

  return (
    <div>
      {PROJECT_FEATURES_LIST.map((feature) => (
        <div
          key={feature.property}
          className="flex items-center justify-between gap-x-8 gap-y-2 border-b border-custom-border-100 bg-custom-background-100 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded bg-custom-background-90 p-3">{feature.icon}</div>
            <div className="">
              <h4 className="text-sm font-medium">{feature.title}</h4>
              <p className="text-sm tracking-tight text-custom-text-200">{feature.description}</p>
            </div>
          </div>
          <ToggleSwitch
            value={Boolean(currentProjectDetails?.[feature.property as keyof IProject])}
            onChange={() => {
              setTrackElement("PROJECT_SETTINGS_FEATURES_PAGE");
              postHogEventTracker(`TOGGLE_${feature.title.toUpperCase()}`, {
                workspace_id: currentWorkspace?.id,
                workspace_slug: currentWorkspace?.slug,
                project_id: currentProjectDetails?.id,
                project_name: currentProjectDetails?.name,
                project_identifier: currentProjectDetails?.identifier,
                enabled: !currentProjectDetails?.[feature.property as keyof IProject],
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
