// plane imports
import { ScrollArea } from "@plane/propel/scrollarea";
import { cn } from "@plane/utils";
// local imports
import { ProjectSettingsSidebarHeader } from "./header";
import { ProjectSettingsSidebarItemCategories } from "./item-categories";

type Props = {
  className?: string;
  projectId: string;
};

export function ProjectSettingsSidebarRoot(props: Props) {
  const { className, projectId } = props;

  return (
    <ScrollArea
      scrollType="hover"
      orientation="vertical"
      size="sm"
      rootClassName={cn("shrink-0 h-full w-[250px] bg-surface-1 border-r border-r-subtle overflow-y-scroll", className)}
    >
      <ProjectSettingsSidebarHeader projectId={projectId} />
      <ProjectSettingsSidebarItemCategories projectId={projectId} />
    </ScrollArea>
  );
}
