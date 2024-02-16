import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
// components
import { WorkspaceSettingsSidebar } from "./sidebar";
// helpers
import { cn } from "helpers/common.helper";
// constants
import { WORKSPACE_SETTINGS_LINKS } from "constants/workspace";

export interface IWorkspaceSettingLayout {
  children: ReactNode;
}

export const WorkspaceSettingLayout: FC<IWorkspaceSettingLayout> = (props) => {
  const { children } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  return (
    <div>
      <div className="h-10 w-full sticky flex md:hidden overflow-x-scroll z-10 bg-custom-background-100 border-b border-custom-border-200 top-0">
        {WORKSPACE_SETTINGS_LINKS.map((link) => (
          <div
            onClick={() => router.push(`/${workspaceSlug}${link.href}`)}
            className={cn(
              "h-full flex items-center px-4",
              link.highlight(router.asPath, `/${workspaceSlug}`)
                ? "border-b border-custom-primary-100"
                : ""
            )}
          >
            <p className="whitespace-nowrap py-1 text-sm text-custom-text-300">{link.label}</p>
          </div>
        ))}
      </div>
      <div className="inset-y-0 z-20 flex h-full w-full gap-2 overflow-x-hidden overflow-y-scroll">
        <div className="w-80 flex-shrink-0 overflow-y-hidden pt-8 sm:hidden hidden md:block lg:block">
          <WorkspaceSettingsSidebar />
        </div>
        <div className="w-full px-4 md:pl-0 md:pr-9">{children}</div>
      </div>
    </div>
  );
};
