/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Command } from "cmdk";
import { Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
// plane imports
// components
import type { TPowerKContext } from "@/components/power-k/core/types";
// plane web imports
import { PowerKModalCommandItem } from "@/components/power-k/ui/modal/command-item";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";

export type TPowerKModalNoSearchResultsCommandProps = {
  context: TPowerKContext;
  searchTerm: string;
  updateSearchTerm: (value: string) => void;
};

export function PowerKModalNoSearchResultsCommand(props: TPowerKModalNoSearchResultsCommandProps) {
  const { context, searchTerm, updateSearchTerm } = props;
  // translation
  const { t } = useTranslation();
  // navigation
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { isWorkspaceFeatureEnabled } = useWorkspace();
  const isFileLibraryEnabled =
    !!workspaceSlug && isWorkspaceFeatureEnabled(workspaceSlug.toString(), "file_library");

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
      {/* Ask the contracts AI — opens the RAG chat seeded with the search */}
      {isFileLibraryEnabled && (
        <PowerKModalCommandItem
          icon={Sparkles}
          value="no-results-ai-contracts"
          label={
            <p className="flex items-center gap-2">
              {t("file_library.contracts.chat.power_k_search")}
              <span className="shrink-0 truncate text-13 text-tertiary">&quot;{searchTerm}&quot;</span>
            </p>
          }
          onSelect={() => {
            context.closePalette();
            router.push(
              `/${workspaceSlug}/file-library/contracts?chat=${encodeURIComponent(searchTerm)}`
            );
          }}
        />
      )}
    </Command.Group>
  );
}
