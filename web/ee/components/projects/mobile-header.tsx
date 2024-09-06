import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// icons
import { ChevronDown } from "lucide-react";
// hooks
import { useWorkspace } from "@/hooks/store";
import { ProjectScopeDropdown } from "./dropdowns";
import { ProjectAttributesDropdown, ProjectDisplayFiltersDropdown, ProjectLayoutSelection } from "./header";

export const ProjectsListMobileHeader = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const { currentWorkspace } = useWorkspace();
  const pathname = usePathname();

  const workspaceId = currentWorkspace?.id || undefined;
  const isArchived = pathname.includes("/archives");

  const customButton = (label: string) => (
    <div className="flex text-sm items-center gap-2 neutral-primary text-custom-text-200">
      {label}
      <ChevronDown className="h-3 w-3" strokeWidth={2} />
    </div>
  );
  if (!workspaceId || !workspaceSlug) return null;
  return (
    <div className="flex py-2 border-b border-custom-border-200 md:hidden bg-custom-background-100 w-full">
      {!isArchived && (
        <div className="border-l border-custom-border-200 flex justify-around w-full">
          <ProjectLayoutSelection workspaceSlug={workspaceSlug.toString()} />
        </div>
      )}
      {!isArchived && (
        <div className="border-l border-custom-border-200 flex justify-around w-full">
          <ProjectScopeDropdown workspaceSlug={workspaceSlug.toString()} className={"border-none"} />
        </div>
      )}
      <div className="border-l border-custom-border-200 flex justify-around w-full">
        <ProjectAttributesDropdown
          workspaceSlug={workspaceSlug.toString()}
          workspaceId={workspaceId}
          menuButton={customButton("Filters")}
        />
      </div>
      <div className="border-l border-custom-border-200 flex justify-around w-full">
        <ProjectDisplayFiltersDropdown workspaceSlug={workspaceSlug.toString()} menuButton={customButton("Display")} />
      </div>
    </div>
  );
});
