import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// plane ui
import { Logo } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar";
// hooks
import { useProject } from "@/hooks/store";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

type Props = {
  teamspaceId: string;
  handleLinkClick: () => void;
};

export const TeamspaceSidebarListItem = observer((props: Props) => {
  const { teamspaceId, handleLinkClick } = props;
  // router params
  const { workspaceSlug } = useParams();
  // pathname
  const pathname = usePathname();
  const { getTeamspaceById, getTeamspaceProjectIds } = useTeamspaces();
  const { getProjectById } = useProject();
  // router
  const router = useRouter();
  // state for disclosure
  const [isExpanded, setIsExpanded] = useState(false);

  const teamspace = getTeamspaceById(teamspaceId);
  const projectIds = getTeamspaceProjectIds(teamspaceId) || [];

  if (!teamspace) return null;

  return (
    <Disclosure as="div" className="flex flex-col">
      <div className="group group/teamspace-item hover:bg-custom-sidebar-background-90 px-2 py-1 rounded-md flex items-center">
        <Disclosure.Button
          as="button"
          className="flex-1 flex items-center gap-1.5 py-[1px] text-left outline-none justify-between w-full"
          onClick={() => handleLinkClick()}
        >
          <div
            className="flex flex-1 items-center gap-1.5 py-[1px] truncate"
            onClick={() => {
              router.push(`/${workspaceSlug}/teamspaces/${teamspaceId}`);
            }}
          >
            <Logo logo={teamspace.logo_props} size={16} />
            <p className="text-sm leading-5 font-medium truncate">{teamspace.name}</p>
          </div>
        </Disclosure.Button>
        <Disclosure.Button
          as="button"
          className="flex-shrink-0 size-4 text-custom-sidebar-text-400 transition-all opacity-0 group-hover/teamspace-item:opacity-100"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronRight
            className={cn("flex-shrink-0 size-4 text-custom-sidebar-text-400 transition-transform", {
              "rotate-90": isExpanded,
            })}
          />
        </Disclosure.Button>
      </div>

      <Transition
        show={isExpanded}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isExpanded && projectIds.length > 0 && (
          <Disclosure.Panel as="div" className="flex flex-col gap-0.5 ml-4 mt-1" static>
            {projectIds.map((projectId) => {
              const project = getProjectById(projectId);
              if (!project) return null;

              const isProjectActive = pathname.includes(
                `/${workspaceSlug}/teamspaces/${teamspaceId}/projects${projectId}`
              );

              return (
                <Link
                  key={projectId}
                  href={`/${workspaceSlug}/teamspaces/${teamspaceId}/projects/${projectId}`}
                  onClick={handleLinkClick}
                >
                  <SidebarNavItem isActive={isProjectActive}>
                    <div className="flex items-center gap-1.5 py-[1px] truncate">
                      <Logo logo={project.logo_props} size={14} />
                      <p className="text-xs leading-4 font-medium truncate">{project.name}</p>
                    </div>
                  </SidebarNavItem>
                </Link>
              );
            })}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
});
