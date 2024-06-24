"use client";

import { Command } from "cmdk";
// types
import { IWorkspaceSearchResults } from "@plane/types";
// helpers
import { commandGroups } from "@/components/command-palette";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  closePalette: () => void;
  results: IWorkspaceSearchResults;
};

export const CommandPaletteSearchResults: React.FC<Props> = (props) => {
  const { closePalette, results } = props;

  const router = useAppRouter();

  return (
    <>
      {Object.keys(results.results).map((key) => {
        const section = (results.results as any)[key];
        const currentSection = commandGroups[key];

        if (section.length > 0) {
          return (
            <Command.Group key={key} heading={`${currentSection.title} search`}>
              {section.map((item: any) => (
                <Command.Item
                  key={item.id}
                  onSelect={() => {
                    closePalette();
                    router.push(currentSection.path(item));
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
};
