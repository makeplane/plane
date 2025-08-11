import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, ChevronRightIcon, FileText, Layers } from "lucide-react";
// ui
import { LayersIcon, ContrastIcon } from "@plane/ui";

type TTeamQuickLink = {
  key: string;
  name: string;
  icon: React.ReactNode;
  href: string;
};

export const TeamsOverviewQuickLinks = observer(() => {
  const { teamspaceId } = useParams();
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  // derived values
  const workspaceSlug = routerWorkspaceSlug?.toString();

  const TEAM_QUICK_LINKS: TTeamQuickLink[] = [
    {
      key: "projects",
      name: "Projects",
      icon: <Briefcase className="size-4 text-custom-text-300" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/projects`,
    },
    {
      key: "issues",
      name: "Work items",
      icon: <LayersIcon className="size-4 text-custom-text-300" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/issues`,
    },
    {
      key: "cycles",
      name: "Cycles",
      icon: <ContrastIcon className="size-4 text-custom-text-300" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/cycles`,
    },
    {
      key: "views",
      name: "Views",
      icon: <Layers className="size-4 text-custom-text-300" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/views`,
    },
    {
      key: "pages",
      name: "Pages",
      icon: <FileText className="size-4 text-custom-text-300" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/pages`,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-y-3 pb-6">
      <div className="text-sm font-semibold text-custom-text-300">Jump into</div>
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-5 items-center gap-4">
        {TEAM_QUICK_LINKS.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className="group flex w-full items-center justify-between gap-2 p-2 border border-custom-border-200 rounded-lg"
          >
            <div className="flex items-center gap-x-2">
              <div className="flex items-center justify-center size-8 bg-custom-background-90 group-hover:bg-custom-background-80/60 rounded">
                {link.icon}
              </div>
              <span className="text-sm font-medium text-custom-text-200 group-hover:text-custom-text-100">
                {link.name}
              </span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex-shrink-0">
              <ChevronRightIcon className="size-4 text-custom-text-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});
