"use client";

import { Command } from "cmdk";
import { useParams } from "next/navigation";
// plane types
import { IWorkspaceSearchResults } from "@plane/types";
// helpers
import { commandGroups } from "@/components/command-palette";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// local components
import { PowerKCommandItem } from "./command-item";

type Props = {
  handleClose: () => void;
  results: IWorkspaceSearchResults;
};

export const PowerKSearchResults: React.FC<Props> = (props) => {
  const { handleClose, results } = props;
  // router
  const router = useAppRouter();
  const { projectId: routerProjectId } = useParams();
  // derived values
  const projectId = routerProjectId?.toString();

  return (
    <>
      {Object.keys(results.results).map((key) => {
        const section = results.results[key as keyof typeof results.results];
        const currentSection = commandGroups[key];

        if (section.length > 0) {
          return (
            <Command.Group key={key} heading={currentSection.title}>
              {section.map((item: any) => (
                <PowerKCommandItem
                  key={item.id}
                  icon={currentSection.icon ?? undefined}
                  value={`${key}-${item?.id}-${item.name}-${item.project__identifier ?? ""}-${item.sequence_id ?? ""}`}
                  label={currentSection.itemName(item)}
                  onSelect={() => {
                    handleClose();
                    router.push(currentSection.path(item, projectId));
                  }}
                />
              ))}
            </Command.Group>
          );
        }
      })}
    </>
  );
};
