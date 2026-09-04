/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
import type { TDisplayConfig } from "@plane/editor";
import type { JSONContent, TPageVersion } from "@plane/types";
import { isJSONContentEmpty } from "@plane/utils";
// components
import { DocumentEditor } from "@/components/editor/document/editor";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web hooks
import type { EPageStoreType } from "@/hooks/store";

export type TVersionEditorProps = {
  activeVersion: string | null;
  versionDetails: TPageVersion | undefined;
  storeType: EPageStoreType;
};

export const PagesVersionEditor = observer(function PagesVersionEditor(props: TVersionEditorProps) {
  const { t } = useTranslation();
  const { activeVersion, versionDetails } = props;
  // params
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug?.toString() ?? "");
  // page filters
  const { fontSize, fontStyle } = usePageFilters();

  const displayConfig: TDisplayConfig = {
    fontSize,
    fontStyle,
    wideLayout: true,
  };

  if (!versionDetails)
    return (
      <div className="size-full px-5">
        <Skeleton aria-label={t("aria_labels.loading.page_version")}>
          <div className="relative space-y-4">
            <SkeletonItem blockSize="36px" inlineSize="50%" />
            <div className="space-y-2">
              <div className="py-2">
                <SkeletonItem blockSize="36px" />
              </div>
              <SkeletonItem blockSize="22px" inlineSize="80%" />
              <div className="relative flex items-center gap-2">
                <SkeletonItem blockSize="30px" inlineSize="30px" />
                <SkeletonItem blockSize="22px" inlineSize="30%" />
              </div>
              <div className="py-2">
                <SkeletonItem blockSize="36px" inlineSize="60%" />
              </div>
              <SkeletonItem blockSize="22px" inlineSize="70%" />
              <SkeletonItem blockSize="22px" inlineSize="30%" />
              <div className="relative flex items-center gap-2">
                <SkeletonItem blockSize="30px" inlineSize="30px" />
                <SkeletonItem blockSize="22px" inlineSize="30%" />
              </div>
              <div className="py-2">
                <SkeletonItem blockSize="30px" inlineSize="50%" />
              </div>
              <SkeletonItem blockSize="22px" />
              <div className="py-2">
                <SkeletonItem blockSize="30px" inlineSize="30%" />
              </div>
              <SkeletonItem blockSize="22px" inlineSize="30%" />
              <div className="relative flex items-center gap-2">
                <div className="py-2">
                  <SkeletonItem blockSize="30px" inlineSize="30px" />
                </div>
                <SkeletonItem blockSize="22px" inlineSize="30%" />
              </div>
            </div>
          </div>
        </Skeleton>
      </div>
    );

  const description = isJSONContentEmpty(versionDetails?.description_json as JSONContent)
    ? versionDetails?.description_html
    : versionDetails?.description_json;

  if (!description) return null;

  return (
    <DocumentEditor
      key={activeVersion ?? ""}
      editable={false}
      id={activeVersion ?? ""}
      value={description}
      containerClassName="p-0 pb-64 border-none"
      displayConfig={displayConfig}
      editorClassName="pl-10"
      projectId={projectId?.toString()}
      workspaceId={workspaceDetails?.id ?? ""}
      workspaceSlug={workspaceSlug?.toString() ?? ""}
    />
  );
});
