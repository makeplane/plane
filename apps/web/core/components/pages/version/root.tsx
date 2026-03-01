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

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
// plane imports
import type { TPageVersion } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// plane web imports
import type { EPageStoreType } from "@/plane-web/hooks/store";
// local imports
import { PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM, PAGE_NAVIGATION_PANE_WIDTH } from "../navigation-pane";
import type { TVersionEditorProps } from "./editor";
import { PageVersionsMainContent } from "./main-content";

// Hoist static style object outside component (rendering-hoist-jsx)
const OVERLAY_STYLE = { width: `calc(100% - ${PAGE_NAVIGATION_PANE_WIDTH}px)` } as const;

type Props = {
  editorComponent: React.FC<TVersionEditorProps>;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  handleRestore: (descriptionJSON: object) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
  storeType: EPageStoreType;
};

export const PageVersionsOverlay = observer(function PageVersionsOverlay(props: Props) {
  const { editorComponent, fetchAllVersions, handleRestore, pageId, restoreEnabled, storeType } = props;
  // navigation
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const { updateQueryParams } = useQueryParams();
  // derived values
  const activeVersion = searchParams.get(PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM);
  const isOpen = !!activeVersion;

  const handleClose = useCallback(() => {
    const updatedRoute = updateQueryParams({
      paramsToRemove: [PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM],
    });
    router.push(updatedRoute);
  }, [router, updateQueryParams]);

  return (
    <div
      className={cn(
        "absolute inset-0 z-[16] h-full bg-surface-1 flex overflow-hidden opacity-0 pointer-events-none transition-opacity",
        {
          "opacity-100 pointer-events-auto": isOpen,
        }
      )}
      style={OVERLAY_STYLE}
    >
      <PageVersionsMainContent
        activeVersion={activeVersion}
        editorComponent={editorComponent}
        fetchAllVersions={fetchAllVersions}
        handleClose={handleClose}
        handleRestore={handleRestore}
        pageId={pageId}
        restoreEnabled={restoreEnabled}
        storeType={storeType}
      />
    </div>
  );
});
