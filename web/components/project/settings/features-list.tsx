import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { ContrastIcon, FileText, Inbox, Layers } from "lucide-react";
import { DiceIcon, ToggleSwitch } from "@plane/ui";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { MiscellaneousEventType, TrackEventService } from "services/track_event.service";
// hooks
import useToast from "hooks/use-toast";
// types
import { IProject } from "types";

type Props = {};

const PROJECT_FEATURES_LIST = [
  {
    title: "Cycles",
    description: "Cycles are enabled for all the projects in this workspace. Access them from the sidebar.",
    icon: <ContrastIcon className="h-4 w-4 text-purple-500 flex-shrink-0 rotate-180" />,
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
    icon: <Layers className="h-4 w-4 text-cyan-500 flex-shrink-0" />,
    property: "issue_views_view",
  },
  {
    title: "Pages",
    description: "Pages are enabled for all the projects in this workspace. Access it from the sidebar.",
    icon: <FileText className="h-4 w-4 text-red-400 flex-shrink-0" />,
    property: "page_view",
  },
  {
    title: "Inbox",
    description: "Inbox are enabled for all the projects in this workspace. Access it from the issues views page.",
    icon: <Inbox className="h-4 w-4 text-fuchsia-500 flex-shrink-0" />,
    property: "inbox_view",
  },
];

const getEventType = (feature: string, toggle: boolean): MiscellaneousEventType => {
  switch (feature) {
    case "Cycles":
      return toggle ? "TOGGLE_CYCLE_ON" : "TOGGLE_CYCLE_OFF";
    case "Modules":
      return toggle ? "TOGGLE_MODULE_ON" : "TOGGLE_MODULE_OFF";
    case "Views":
      return toggle ? "TOGGLE_VIEW_ON" : "TOGGLE_VIEW_OFF";
    case "Pages":
      return toggle ? "TOGGLE_PAGES_ON" : "TOGGLE_PAGES_OFF";
    case "Inbox":
      return toggle ? "TOGGLE_INBOX_ON" : "TOGGLE_INBOX_OFF";
    default:
      throw new Error("Invalid feature");
  }
};

// services
const trackEventService = new TrackEventService();

export const ProjectFeaturesList: FC<Props> = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const {
    project: { currentProjectDetails, updateProject },
    user: { currentUser, currentProjectRole },
  } = useMobxStore();
  const isAdmin = currentProjectRole === 20;
  // hooks
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
            <div className="flex items-center justify-center p-3 rounded bg-custom-background-90">{feature.icon}</div>
            <div className="">
              <h4 className="text-sm font-medium">{feature.title}</h4>
              <p className="text-sm text-custom-text-200 tracking-tight">{feature.description}</p>
            </div>
          </div>
          <ToggleSwitch
            value={currentProjectDetails?.[feature.property as keyof IProject]}
            onChange={() => {
              trackEventService.trackMiscellaneousEvent(
                {
                  workspaceId: (currentProjectDetails?.workspace as any)?.id,
                  workspaceSlug,
                  projectId,
                  projectIdentifier: currentProjectDetails?.identifier,
                  projectName: currentProjectDetails?.name,
                },
                getEventType(feature.title, !currentProjectDetails?.[feature.property as keyof IProject]),
                currentUser
              );
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
