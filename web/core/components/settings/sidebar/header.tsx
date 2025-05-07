import { getUserRole } from "@/helpers/user.helper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { WorkspaceEditionBadge } from "@/plane-web/components/workspace/edition-badge";
import WorkspaceLogo from "../workspace-logo";

export const SettingsSidebarHeader = (props: { customHeader?: React.ReactNode }) => {
  const { customHeader } = props;
  const { currentWorkspace } = useWorkspace();
  return customHeader
    ? customHeader
    : currentWorkspace && (
        <div className="flex w-full gap-3 items-center justify-between">
          <div className="flex w-full gap-3 items-center overflow-hidden">
            <WorkspaceLogo
              workspace={{
                logo_url: currentWorkspace.logo_url || "",
                name: currentWorkspace.name,
              }}
              size="md"
            />
            <div className="w-full overflow-hidden">
              <div className="text-base font-medium text-custom-text-200 truncate text-ellipsis ">
                {currentWorkspace.name}
              </div>
              <div className="text-sm text-custom-text-300 capitalize">
                {getUserRole(currentWorkspace.role)?.toLowerCase() || "guest"}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <WorkspaceEditionBadge
              isEditable={false}
              className="text-xs rounded-md min-w-fit px-1 py-0.5 flex-shrink-0"
            />
          </div>
        </div>
      );
};
