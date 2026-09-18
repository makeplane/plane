/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import type { TPageRootHandlers } from "@/components/pages/editor/page-root";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PageNavigationPaneInfoTabActorsInfo } from "./actors-info";
import { PageNavigationPaneInfoTabDocumentInfo } from "./document-info";
import { PageNavigationPaneInfoTabVersionHistory } from "./version-history";

type Props = {
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
};

export const PageNavigationPaneInfoTabPanel = observer(function PageNavigationPaneInfoTabPanel(props: Props) {
  const { page, versionHistory } = props;
  return (
    <div className="flex h-full flex-col px-4">
      <div className="mt-5 flex-1 overflow-y-auto">
        <PageNavigationPaneInfoTabDocumentInfo page={page} />
        <PageNavigationPaneInfoTabActorsInfo page={page} />
        <div className="my-3 h-px flex-shrink-0 bg-layer-1" />
        <PageNavigationPaneInfoTabVersionHistory page={page} versionHistory={versionHistory} />
      </div>
    </div>
  );
});
