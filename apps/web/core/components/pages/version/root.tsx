/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
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

type Props = {
  editorComponent: React.FC<TVersionEditorProps>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
  storeType: EPageStoreType;
};

export const PageVersionsOverlay = observer(function PageVersionsOverlay(props: Props) {
  const { editorComponent, fetchVersionDetails, handleRestore, pageId, restoreEnabled, storeType } = props;
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
        "pointer-events-none absolute inset-0 z-[16] flex h-full overflow-hidden bg-surface-1 opacity-0 transition-opacity",
        {
          "pointer-events-auto opacity-100": isOpen,
        }
      )}
      style={{
        width: `calc(100% - ${PAGE_NAVIGATION_PANE_WIDTH}px)`,
      }}
    >
      <PageVersionsMainContent
        activeVersion={activeVersion}
        editorComponent={editorComponent}
        fetchVersionDetails={fetchVersionDetails}
        handleClose={handleClose}
        handleRestore={handleRestore}
        pageId={pageId}
        restoreEnabled={restoreEnabled}
        storeType={storeType}
      />
    </div>
  );
});
