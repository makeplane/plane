import { useRef } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { FileText } from "lucide-react";
// editor
import { DocumentReadOnlyEditorWithRef, EditorRefApi } from "@plane/editor";
// ui
import { Logo } from "@plane/ui";
// hooks
import { usePublish } from "@/hooks/store";
import { useMention } from "@/hooks/use-mention";
// plane web components
import { IssueEmbedCard } from "@/plane-web/components/pages";
// plane web hooks
import { usePage, usePagesList } from "@/plane-web/hooks/store";

type Props = {
  anchor: string;
};

export const PageDetailsMainContent: React.FC<Props> = observer((props) => {
  const { anchor } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const publishSettings = usePublish(anchor);
  const { fetchPageDetails } = usePagesList();
  const pageDetails = usePage(anchor);
  // mention hook
  const { mentionHighlights } = useMention();

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

  if (!publishSettings || !pageDetails) return null;

  return (
    <div className="size-full flex justify-center overflow-y-auto vertical-scrollbar scrollbar-md">
      <div className="xl:w-1/2 mt-6 xl:mt-20 px-5 md:px-10 xl:p-0 space-y-4">
        <div className="space-y-2">
          <div className="size-[60px] bg-custom-background-80 rounded grid place-items-center">
            {pageDetails.logo_props?.in_use ? (
              <Logo logo={pageDetails.logo_props} size={36} type="lucide" />
            ) : (
              <FileText className="size-9 text-custom-text-300" />
            )}
          </div>
          <h1 className="text-4xl font-semibold break-words">{pageDetails.name}</h1>
        </div>
        <div className="ml-5">
          <DocumentReadOnlyEditorWithRef
            ref={editorRef}
            initialValue={pageDetails.description_html ?? "<p></p>"}
            containerClassName="p-0 pb-64 border-none"
            mentionHandler={{
              highlights: mentionHighlights,
            }}
            embedHandler={{
              issue: {
                widgetCallback: ({ issueId }) => <IssueEmbedCard anchor={anchor} issueId={issueId} />,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
});
