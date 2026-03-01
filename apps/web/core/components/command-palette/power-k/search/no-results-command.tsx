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
// plane imports
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
// components
import { PowerKModalCommandItem } from "@/components/power-k/ui/modal/command-item";
// types
import type { TPowerKContext } from "@/components/power-k/core/types";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

type TPowerKModalNoSearchResultsCommandProps = {
  context: TPowerKContext;
  searchTerm: string;
  updateSearchTerm: (value: string) => void;
};

export const PowerKModalNoSearchResultsCommand = observer(function PowerKModalNoSearchResultsCommand(
  props: TPowerKModalNoSearchResultsCommandProps
) {
  const { context, searchTerm, updateSearchTerm } = props;
  // navigation
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const isAdvancedSearchEnabled = useFlag(workspaceSlug?.toString() ?? "", "ADVANCED_SEARCH");
  // translation
  const { t } = useTranslation();

  if (!isAdvancedSearchEnabled) {
    return (
      <Command.Group>
        <PowerKModalCommandItem
          icon={SearchIcon}
          value="no-results"
          label={
            <p className="flex items-center gap-2">
              {t("power_k.search_menu.no_results")}{" "}
              <span className="shrink-0 text-13 text-tertiary">{t("power_k.search_menu.clear_search")}</span>
            </p>
          }
          onSelect={() => updateSearchTerm("")}
        />
      </Command.Group>
    );
  }

  return (
    <Command.Group>
      <PowerKModalCommandItem
        icon={SearchIcon}
        value="no-results"
        label={
          <p className="flex items-center gap-2">
            {t("power_k.search_menu.no_results")}{" "}
            <span className="shrink-0 text-13 text-tertiary">{t("power_k.search_menu.go_to_advanced_search")}</span>
          </p>
        }
        onSelect={() => {
          context.closePalette();
          router.push(`/${workspaceSlug?.toString()}/search/?q=${searchTerm}`);
        }}
      />
    </Command.Group>
  );
});
