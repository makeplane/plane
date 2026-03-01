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

import { useRef } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { CustomAIBlockUI, DocumentEditorWithRef } from "@plane/editor";
import type { EditorRefApi } from "@plane/editor";
import { ERowVariant, Row } from "@plane/ui";
// components
import { EditorMentionsRoot } from "@/components/editor/embeds/mentions";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useParseEditorContent } from "@/hooks/use-parse-editor-content";
// plane web imports
import { EmbedHandler } from "@/plane-web/components/editor/external-embed/embed-handler";
import { WorkItemEmbedCard } from "@/plane-web/components/pages";
import { usePage, usePagesList } from "@/plane-web/hooks/store";
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
// local imports
import { PageEmbedCardRoot } from "./page/root";
import { PageHeader } from "./page-head";

type Props = {
  anchor: string;
};

export const PageDetailsMainContent = observer(function PageDetailsMainContent(props: Props) {
  const { anchor } = props;

  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const publishSettings = usePublish(anchor);
  const { fetchPageDetails } = usePagesList();
  const pageDetails = usePage(anchor);
  const { fetchEmbedsAndMentions, hasLoadedEmbedsAndMentions, id, description_json } = pageDetails ?? {};

  useSWR(anchor ? `PAGE_DETAILS_${anchor}` : null, anchor ? () => fetchPageDetails(anchor) : null, {
    revalidateIfStale: false,
  });
  useSWR(
    anchor && fetchEmbedsAndMentions ? `PAGE_EMBEDS_AND_MENTIONS_${anchor}` : null,
    anchor && fetchEmbedsAndMentions ? () => fetchEmbedsAndMentions(anchor) : null,
    {
      revalidateIfStale: false,
    }
  );
  // parse content
  const { getEditorMetaData } = useParseEditorContent({
    anchor,
  });

  const { document } = useEditorFlagging(anchor);
  if (!publishSettings || !pageDetails || !id || !description_json || !hasLoadedEmbedsAndMentions) return null;

  return (
    <Row
      className="relative size-full flex flex-col pt-[64px] overflow-y-auto overflow-x-hidden vertical-scrollbar scrollbar-md duration-200"
      variant={ERowVariant.HUGGING}
    >
      <div id="page-content-container" className="flex flex-col size-full space-y-4">
        <PageHeader pageDetails={pageDetails} />
        <div className="size-full">
          <DocumentEditorWithRef
            editable={false}
            getEditorMetaData={getEditorMetaData}
            ref={editorRef}
            id={id}
            disabledExtensions={document.disabled}
            flaggedExtensions={document.flagged}
            value={description_json}
            containerClassName="p-0 pb-64 border-none"
            fileHandler={getEditorFileHandlers({
              anchor,
              workspaceId: publishSettings.workspace ?? "",
              uploadFile: () => Promise.resolve(""),
            })}
            mentionHandler={{
              renderComponent: (props) => (
                <EditorMentionsRoot {...props} getMentionDetails={pageDetails.getMentionDetails} />
              ),
            }}
            extendedEditorProps={{
              embedHandler: {
                issue: {
                  widgetCallback: ({ issueId }) => <WorkItemEmbedCard anchor={anchor} workItemId={issueId} />,
                },
                externalEmbedComponent: {
                  widgetCallback: EmbedHandler,
                },
                page: {
                  widgetCallback: ({ pageId }) => <PageEmbedCardRoot pageId={pageId} />,
                  workspaceSlug: "",
                },
              },
              aiBlockWidgetCallback: (props) => <CustomAIBlockUI {...props} />,
              isSmoothCursorEnabled: false,
              commentConfig: {
                canComment: false,
                shouldHideComment: true,
              },
            }}
          />
        </div>
      </div>
    </Row>
  );
});
