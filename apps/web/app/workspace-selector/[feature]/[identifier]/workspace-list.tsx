import { Check } from "lucide-react";
// plane imports
import { IWorkspace } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// plane web imports
import { SubscriptionPill } from "@/plane-web/components/common";

type TWorkspaceList = {
  selectedWorkspaceSlug: string | null;
  workspace: IWorkspace;
  handleWorkspaceSelection: (workspace: IWorkspace) => void;
};

export const WorkspaceList = (props: TWorkspaceList) => {
  const { selectedWorkspaceSlug, workspace, handleWorkspaceSelection } = props;

  return (
    <div className="w-full bg-custom-background-100 rounded">
      <div
        className={cn(
          "relative rounded p-2.5 flex items-center justify-between gap-2 border-[0.5px] border-custom-border-200 transition-all duration-200",
          {
            "bg-custom-primary-100/10 border-custom-primary-100": selectedWorkspaceSlug === workspace.slug,
            "hover:bg-custom-primary-100/5 hover:border-custom-primary-100": selectedWorkspaceSlug !== workspace.slug,
          }
        )}
        onClick={() => handleWorkspaceSelection(workspace)}
      >
        <div className="flex gap-2 items-center">
          <WorkspaceLogo logo={workspace.logo_url} name={workspace.name} classNames="text-sm" />
          <div className="text-sm text-custom-text-200 font-medium">{workspace.name}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <SubscriptionPill workspace={workspace} />
          {selectedWorkspaceSlug === workspace.slug && (
            <div
              className={cn(
                "absolute -right-1.5 top-0.5 -translate-y-1/2 size-3.5 bg-custom-primary-100 rounded-full flex items-center justify-center"
              )}
            >
              <Check className="text-white size-2.5 m-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
