import { observer } from "mobx-react";
// plane imports
import { getUserRole } from "@plane/utils";
// components
import { WorkspaceLogo } from "@/components/workspace";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { SubscriptionPill } from "@/plane-web/components/common";

export const SettingsSidebarHeader = observer((props: { customHeader?: React.ReactNode }) => {
  const { customHeader } = props;
  const { currentWorkspace } = useWorkspace();
  return customHeader
    ? customHeader
    : currentWorkspace && (
        <div className="flex w-full gap-3 items-center justify-between pr-2">
          <div className="flex w-full gap-3 items-center overflow-hidden">
            <WorkspaceLogo
              logo={currentWorkspace.logo_url ?? ""}
              name={currentWorkspace.name ?? ""}
              classNames="size-8 border border-custom-border-200"
            />
            <div className="w-full overflow-hidden">
              <div className="text-base font-medium text-custom-text-200 truncate text-ellipsis ">
                {currentWorkspace.name ?? "Workspace"}
              </div>
              <div className="text-sm text-custom-text-300 capitalize">
                {getUserRole(currentWorkspace.role)?.toLowerCase() || "guest"}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <SubscriptionPill />
          </div>
        </div>
      );
});
