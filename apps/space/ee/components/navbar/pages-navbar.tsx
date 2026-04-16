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

import { observer } from "mobx-react";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
// plane web imports
import { usePage } from "@/plane-web/hooks/store";

import { PagesCopyLink } from "./pages-copy-link";
import { PagesQuickActions } from "./pages-actions";

type PagesNavbarRootProps = { anchor: string };

export const PagesNavbarRoot = observer(function PagesNavbarRoot(props: PagesNavbarRootProps) {
  const { anchor } = props;

  const pageDetails = usePage(anchor);

  return (
    <div className="relative flex justify-between w-full gap-4 px-5">
      {/* page name */}
      <div className="w-full flex items-center gap-2 text-secondary">
        <div className="shrink-0">
          {pageDetails?.logo_props?.in_use ? (
            <Logo logo={pageDetails.logo_props} size={16} type="lucide" />
          ) : (
            <PageIcon className="size-4" />
          )}
        </div>

        <div className="truncate text-h6-medium">{pageDetails?.name}</div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <PagesCopyLink anchor={anchor} />
        <PagesQuickActions anchor={anchor} />
      </div>
    </div>
  );
});
