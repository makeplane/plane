/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { PowerKModalCommandItem } from "@/components/power-k/ui/modal/command-item";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import type { IAppSearchResults } from "@/types";
// local imports
import { WIKI_APP_POWER_K_SEARCH_RESULTS_GROUPS_MAP } from "./search-results-map";

type Props = {
  closePalette: () => void;
  results: IAppSearchResults;
};

export const WikiAppPowerKModalSearchResults = observer(function WikiAppPowerKModalSearchResults(props: Props) {
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
        const currentSection =
          WIKI_APP_POWER_K_SEARCH_RESULTS_GROUPS_MAP[key as keyof typeof WIKI_APP_POWER_K_SEARCH_RESULTS_GROUPS_MAP];

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
