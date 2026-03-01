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

import React from "react";
import { observer } from "mobx-react";
// components
import { Logo } from "@plane/propel/emoji-icon-picker";
// plane web imports
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePage } from "@/plane-web/hooks/store";

type Props = {
  pageId: string;
  storeType: EPageStoreType;
};

export const DownloadNestedPagesModalSubPageItem = observer(function DownloadNestedPagesModalSubPageItem(props: Props) {
  const { pageId, storeType } = props;
  // store hooks
  const page = usePage({
    pageId,
    storeType,
  });
  // derived values
  const { logo_props, name } = page ?? {};

  if (!page) return null;

  return (
    <div className="flex items-center gap-2 p-1">
      {logo_props && (
        <div className="shrink-0 size-6 grid place-items-center bg-layer-1 rounded">
          <Logo logo={logo_props} type="lucide" size={16} />
        </div>
      )}
      <h6 className="text-13 font-medium truncate">{name}</h6>
    </div>
  );
});
