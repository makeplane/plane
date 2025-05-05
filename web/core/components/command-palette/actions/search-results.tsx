"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { IWorkspaceSearchResults } from "@plane/types";
// hooks
import { useCommandPalette } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { commandGroups } from "@/plane-web/components/command-palette";
// helpers
import { openProjectAndScrollToSidebar } from "./helper";

type Props = {
  closePalette: () => void;
  results: IWorkspaceSearchResults;
};

export const CommandPaletteSearchResults: React.FC<Props> = observer((props) => {
  const { closePalette, results } = props;
  // router
  const router = useAppRouter();
  const { projectId: routerProjectId } = useParams();
  // command palette
  const { toggleProjectListOpen } = useCommandPalette();
  // derived values
  const projectId = routerProjectId?.toString();

  return (
    <>
      {Object.keys(results.results).map((key) => {
        // TODO: add type for results
        const section = (results.results as any)[key];
        const currentSection = commandGroups[key];
        if (!currentSection) return null;
        if (section.length > 0) {
          return (
            <Command.Group key={key} heading={`${currentSection.title} search`}>
              {section.map((item: any) => (
                <Command.Item
                  key={item.id}
                  onSelect={() => {
                    closePalette();
                    router.push(currentSection.path(item, projectId));
                    const itemProjectId = item.project_id || (item.project_ids && item.project_ids[0]) || undefined;
                    openProjectAndScrollToSidebar(itemProjectId, toggleProjectListOpen);
                  }}
                  value={`${key}-${item?.id}-${item.name}-${item.project__identifier ?? ""}-${item.sequence_id ?? ""}`}
                  className="focus:outline-none"
                >
                  <div className="flex items-center gap-2 overflow-hidden text-custom-text-200">
                    {currentSection.icon}
                    <p className="block flex-1 truncate">{currentSection.itemName(item)}</p>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          );
        }
      })}
    </>
  );
});
