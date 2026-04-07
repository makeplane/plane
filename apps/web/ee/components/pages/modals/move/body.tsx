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

import { AlertCircle } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
// local imports
import { MovePageModalSections } from "./sections/root";

type Props = {
  canPageBeMovedToTeamspace: boolean;
  canPageBeMovedToWiki: boolean;
  searchTerm: string;
};

export function MovePageModalBody(props: Props) {
  const { canPageBeMovedToTeamspace, canPageBeMovedToWiki, searchTerm } = props;
  // translation
  const { t } = useTranslation();

  return (
    <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto">
      {!canPageBeMovedToTeamspace && (
        <section className="mb-3 px-2">
          <div className="p-2 bg-layer-1 rounded-sm flex items-center gap-2 text-tertiary">
            <AlertCircle className="shrink-0 size-3.5" />
            <p className="text-11 font-medium">{t("page_actions.move_page.cannot_move_to_teamspace")}</p>
          </div>
        </section>
      )}
      <MovePageModalSections
        canPageBeMovedToTeamspace={canPageBeMovedToTeamspace}
        canPageBeMovedToWiki={canPageBeMovedToWiki}
        searchTerm={searchTerm}
      />
    </Combobox.Options>
  );
}
