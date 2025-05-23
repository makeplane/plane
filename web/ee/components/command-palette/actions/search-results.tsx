"use client";

import { Command } from "cmdk";
// components
import { openProjectAndScrollToSidebar } from "@/components/command-palette/actions/helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web helpers
import { pagesAppCommandGroups } from "@/plane-web/components/command-palette";
// plane web types
import { IAppSearchResults } from "@/plane-web/types";

type Props = {
  closePalette: () => void;
  results: IAppSearchResults;
};

export const PagesAppCommandPaletteSearchResults: React.FC<Props> = (props) => {
  const { closePalette, results } = props;
  const router = useAppRouter();

  return (
    <>
      {Object.keys(results.results).map((key) => {
        const section = (results.results as any)[key];
        const currentSection = pagesAppCommandGroups[key];

        if (section.length > 0) {
          return (
            <Command.Group key={key} heading={`${currentSection.title} search`}>
              {section.map((item: any) => (
                <Command.Item
                  key={item.id}
                  onSelect={() => {
                    closePalette();
                    router.push(currentSection.path(item, undefined));
                    const itemProjectId =
                      item?.project_id ||
                      (Array.isArray(item?.project_ids) && item?.project_ids?.length > 0
                        ? item?.project_ids[0]
                        : undefined);
                    if (itemProjectId) openProjectAndScrollToSidebar(itemProjectId);
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
