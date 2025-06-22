import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@plane/utils";
import { useProject } from "@/hooks/store";

const TABS = {
  account: {
    key: "account",
    label: "Account",
    href: `/settings/account/`,
  },
  workspace: {
    key: "workspace",
    label: "Workspace",
    href: `/settings/`,
  },
  projects: {
    key: "projects",
    label: "Projects",
    href: `/settings/projects/`,
  },
};

const SettingsTabs = observer(() => {
  // router
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  // store hooks
  const { joinedProjectIds } = useProject();

  const currentTab = pathname.includes(TABS.projects.href)
    ? TABS.projects
    : pathname.includes(TABS.account.href)
      ? TABS.account
      : TABS.workspace;

  return (
    <div className="flex w-fit min-w-fit items-center justify-between gap-1.5 rounded-md text-sm p-0.5 bg-custom-background-80">
      {Object.values(TABS).map((tab) => {
        const isActive = currentTab?.key === tab.key;
        const href = tab.key === TABS.projects.key ? `${tab.href}${joinedProjectIds[0] || ""}` : tab.href;
        return (
          <Link
            key={tab.key}
            href={`/${workspaceSlug}${href}`}
            className={cn(
              "flex items-center justify-center p-1 min-w-fit w-full font-medium outline-none focus:outline-none cursor-pointer transition-all rounded text-custom-text-200 ",
              {
                "bg-custom-background-100 text-custom-text-100 shadow-sm": isActive,
                "hover:text-custom-text-100 hover:bg-custom-background-80/60": !isActive,
              }
            )}
          >
            <div className="text-xs font-semibold p-1">{tab.label}</div>
          </Link>
        );
      })}
    </div>
  );
});

export default SettingsTabs;
