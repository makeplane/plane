// plane imports
import { ScrollArea } from "@plane/propel/scrollarea";
// local imports
import { ProjectSettingsSidebarHeader } from "./header";
import { ProjectSettingsSidebarItemCategories } from "./item-categories";

type Props = {
  projectId: string;
};

export function ProjectSettingsSidebarRoot(props: Props) {
  const { projectId } = props;

  return (
    <ScrollArea
      scrollType="hover"
      orientation="vertical"
      size="sm"
      rootClassName="shrink-0 animate-fade-in h-full w-[250px] bg-surface-1 border-r border-r-subtle overflow-y-scroll"
      viewportClassName="pb-5"
    >
      <ProjectSettingsSidebarHeader projectId={projectId} />
      <ProjectSettingsSidebarItemCategories projectId={projectId} />
    </ScrollArea>
  );
}
