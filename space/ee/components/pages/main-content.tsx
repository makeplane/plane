import { useRef } from "react";
import { observer } from "mobx-react-lite";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { FileText } from "lucide-react";
// editor
import { DocumentReadOnlyEditorWithRef, EditorRefApi } from "@plane/editor";
// ui
import { ERowVariant, Logo, Row } from "@plane/ui";
// components
import { EditorMentionsRoot } from "@/components/editor";
// helpers
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { usePublish } from "@/hooks/store";
// plane web components
import { IssueEmbedCard } from "@/plane-web/components/pages";
// plane web hooks
import { usePage, usePagesList } from "@/plane-web/hooks/store";
import { PageEmbedCardRoot } from "./page/root";

type Props = {
  anchor: string;
};

export const PageDetailsMainContent: React.FC<Props> = observer((props) => {
  const { anchor } = props;
  // refs
  const { workspaceSlug, projectId } = useParams();

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

  if (!publishSettings || !pageDetails || !pageDetails.id) return null;

  return (
    <Row
      className="relative size-full flex flex-col pt-[64px] overflow-y-auto overflow-x-hidden vertical-scrollbar scrollbar-md duration-200"
      variant={ERowVariant.HUGGING}
    >
      <div id="page-content-container" className="flex flex-col size-full space-y-4">
        <div className="w-full py-3 page-title-container">
          <div className="space-y-2 block bg-transparent w-full max-w-[720px] mx-auto transition-all duration-200 ease-in-out">
            <div className="size-[60px] bg-custom-background-80 rounded grid place-items-center">
              {pageDetails.logo_props?.in_use ? (
                <Logo logo={pageDetails.logo_props} size={36} type="lucide" />
              ) : (
                <FileText className="size-9 text-custom-text-300" />
              )}
            </div>
            <h1 className="tracking-[-2%] font-bold text-[2rem] leading-[2.375rem] break-words">{pageDetails.name}</h1>
          </div>
        </div>
        <div className="size-full">
          <DocumentReadOnlyEditorWithRef
            ref={editorRef}
            id={pageDetails.id}
            disabledExtensions={[]}
            initialValue={pageDetails.description_html ?? "<p></p>"}
            containerClassName="p-0 pb-64 border-none"
            fileHandler={getReadOnlyEditorFileHandlers({
              anchor,
              workspaceId: publishSettings.workspace ?? "",
            })}
            mentionHandler={{
              renderComponent: (props) => <EditorMentionsRoot {...props} />,
            }}
            embedHandler={{
              issue: {
                widgetCallback: ({ issueId }) => <IssueEmbedCard anchor={anchor} issueId={issueId} />,
              },
              page: {
                widgetCallback: ({ pageId }) => <PageEmbedCardRoot pageId={pageId} />,
                workspaceSlug: "",
              },
            }}
          />
        </div>
      </div>
    </Row>
  );
});
