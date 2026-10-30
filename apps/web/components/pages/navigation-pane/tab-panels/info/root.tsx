/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneInfoTabActorsInfo } from "./actors-info";
import { PageNavigationPaneInfoTabDocumentInfo } from "./document-info";

type Props = {
  page: TPageInstance;
};

export const PageNavigationPaneInfoTabPanel = observer(function PageNavigationPaneInfoTabPanel(props: Props) {
  const { page } = props;
  return (
    <div className="flex h-full flex-col px-4">
      <div className="flex-1 overflow-y-auto">
        <PageNavigationPaneInfoTabDocumentInfo page={page} />
        <PageNavigationPaneInfoTabActorsInfo page={page} />
      </div>
    </div>
  );
});
