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

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";

type Props = {
  canPageBeMovedToTeamspace: boolean;
  searchTerm: string;
  updateSearchTerm: (searchTerm: string) => void;
};

export function MovePageModalInput(props: Props) {
  const { canPageBeMovedToTeamspace, searchTerm, updateSearchTerm } = props;
  // navigation
  const { teamspaceId, projectId } = useParams();
  // translation
  const { t } = useTranslation();

  const placeholder = useMemo(() => {
    if (teamspaceId) {
      return t("page_actions.move_page.placeholders.teamspace_to_all");
    }
    if (projectId) {
      if (canPageBeMovedToTeamspace) {
        return t("page_actions.move_page.placeholders.project_to_all");
      }
      return t("page_actions.move_page.placeholders.project_to_project");
    }
    if (canPageBeMovedToTeamspace) {
      return t("page_actions.move_page.placeholders.workspace_to_all");
    }
    return t("page_actions.move_page.placeholders.workspace_to_project");
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [canPageBeMovedToTeamspace, projectId, teamspaceId]);

  return (
    <div className="flex items-center gap-2 px-4">
      <Search className="flex-shrink-0 size-4 text-placeholder" aria-hidden="true" />
      <Combobox.Input
        className="h-12 w-full border-0 bg-transparent text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
        placeholder={placeholder}
        displayValue={() => ""}
        value={searchTerm}
        onChange={(e) => updateSearchTerm(e.target.value)}
      />
    </div>
  );
}
