import { useRef } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { DocumentEditorWithRef, type EditorRefApi } from "@plane/editor";
import { ERowVariant, Row } from "@plane/ui";
// components
import { EditorMentionsRoot } from "@/components/editor/embeds/mentions";
// helpers
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { EmbedHandler } from "@/plane-web/components/editor/external-embed/embed-handler";
// plane web components
import { WorkItemEmbedCard } from "@/plane-web/components/pages";
// plane web hooks
import { usePage, usePagesList } from "@/plane-web/hooks/store";
// local imports
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { PageEmbedCardRoot } from "./page/root";
import { PageHeader } from "./page-head";

type Props = {
  anchor: string;
};

export const PageDetailsMainContent: React.FC<Props> = observer((props) => {
  const { anchor } = props;

  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const publishSettings = usePublish(anchor);
  const { fetchPageDetails } = usePagesList();
  const pageDetails = usePage(anchor);

  useSWR(anchor ? `PAGE_DETAILS_${anchor}` : null, anchor ? () => fetchPageDetails(anchor) : null, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
  });
  useSWR(
    anchor && pageDetails ? `PAGE_ISSUE_EMBEDS_${anchor}` : null,
    anchor && pageDetails ? () => pageDetails.fetchPageIssueEmbeds?.(anchor) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  const { document } = useEditorFlagging(anchor);
  if (!publishSettings || !pageDetails || !pageDetails.id || !pageDetails.description) return null;

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
            ref={editorRef}
            id={pageDetails.id}
            disabledExtensions={document.disabled}
            flaggedExtensions={document.flagged}
            value={pageDetails.description}
            containerClassName="p-0 pb-64 border-none"
            fileHandler={getEditorFileHandlers({
              anchor,
              workspaceId: publishSettings.workspace ?? "",
              uploadFile: async () => "",
            })}
            mentionHandler={{
              renderComponent: (props) => <EditorMentionsRoot {...props} />,
            }}
            extendedEditorProps={{
              embedHandler: {
                issue: {
                  widgetCallback: ({ issueId }) => <WorkItemEmbedCard anchor={anchor} issueId={issueId} />,
                },
                externalEmbedComponent: {
                  widgetCallback: EmbedHandler,
                },
                page: {
                  widgetCallback: ({ pageId }) => <PageEmbedCardRoot pageId={pageId} />,
                  workspaceSlug: "",
                },
              },
              isSmoothCursorEnabled: false,
            }}
          />
        </div>
      </div>
    </Row>
  );
});
