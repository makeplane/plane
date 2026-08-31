/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { IWorkspaceSearchResults } from "@plane/types";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// helpers
import { PowerKModalCommandItem } from "./command-item";
import { POWER_K_SEARCH_RESULTS_GROUPS_MAP, type TPowerKSearchResultItemMap } from "./search-results-map";

type Props = {
  closePalette: () => void;
  results: IWorkspaceSearchResults;
  searchTerm: string;
};

export const PowerKModalSearchResults = observer(function PowerKModalSearchResults(props: Props) {
  const { closePalette, results, searchTerm } = props;
  // router
  const router = useAppRouter();
  const { projectId: routerProjectId } = useParams();
  // derived values
  const projectId = routerProjectId?.toString();

  const renderSearchResultGroup = <TKey extends keyof TPowerKSearchResultItemMap>(
    key: TKey,
    section: TPowerKSearchResultItemMap[TKey][]
  ) => {
    const currentSection = POWER_K_SEARCH_RESULTS_GROUPS_MAP[key];

    if (section.length <= 0) return null;

    return (
      <Command.Group key={key} heading={currentSection.title} forceMount={key === "issue"}>
        {section.map((item) => {
          let value = `${key}-${item?.id}-${item.name}`;

          if ("project__identifier" in item) {
            value = `${value}-${item.project__identifier}`;
          }

          if ("sequence_id" in item) {
            value = `${value}-${item.sequence_id}`;
          }

          if ("description_snippet" in item && item.description_snippet) {
            value = `${value}-${item.description_snippet}`;
          }

          return (
            <PowerKModalCommandItem
              key={item.id}
              isMultiline={key === "issue"}
              label={currentSection.itemName(item, searchTerm)}
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
  };

  return (
    <>
      {(Object.keys(results.results) as (keyof TPowerKSearchResultItemMap)[]).map((key) =>
        renderSearchResultGroup(key, results.results[key])
      )}
    </>
  );
});
