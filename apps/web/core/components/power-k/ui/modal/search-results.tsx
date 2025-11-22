import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { IWorkspaceSearchResults } from "@plane/types";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// helpers
import { openProjectAndScrollToSidebar } from "../../actions/helper";
import { PowerKModalCommandItem } from "./command-item";
import { POWER_K_SEARCH_RESULTS_GROUPS_MAP } from "./search-results-map";

type Props = {
  closePalette: () => void;
  results: IWorkspaceSearchResults;
};

export const PowerKModalSearchResults = observer(function PowerKModalSearchResults(props: Props) {
  const { closePalette, results } = props;
  // router
  const router = useAppRouter();
  const { projectId: routerProjectId } = useParams();
  // derived values
  const projectId = routerProjectId?.toString();

  return (
    <>
      {Object.keys(results.results).map((key) => {
        const section = results.results[key as keyof typeof results.results];
        const currentSection = POWER_K_SEARCH_RESULTS_GROUPS_MAP[key as keyof typeof POWER_K_SEARCH_RESULTS_GROUPS_MAP];

        if (!currentSection) return null;
        if (section.length <= 0) return null;

        return (
          <Command.Group key={key} heading={currentSection.title}>
            {section.map((item) => {
              let value = `${key}-${item?.id}-${item.name}`;

              if ("project__identifier" in item) {
                value = `${value}-${item.project__identifier}`;
              }

              if ("sequence_id" in item) {
                value = `${value}-${item.sequence_id}`;
              }

              return (
                <PowerKModalCommandItem
                  key={item.id}
                  label={currentSection.itemName(item)}
                  icon={currentSection.icon}
                  onSelect={() => {
                    closePalette();
                    router.push(currentSection.path(item, projectId));
                    // const itemProjectId =
                    //   item?.project_id ||
                    //   (Array.isArray(item?.project_ids) && item?.project_ids?.length > 0
                    //     ? item?.project_ids[0]
                    //     : undefined);
                    // if (itemProjectId) openProjectAndScrollToSidebar(itemProjectId);
                  }}
                  value={value}
                />
              );
            })}
          </Command.Group>
        );
      })}
    </>
  );
});
