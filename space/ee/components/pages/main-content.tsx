import { useRef } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { FileText } from "lucide-react";
// editor
import { DocumentReadOnlyEditorWithRef, EditorRefApi } from "@plane/editor";
// ui
import { Logo } from "@plane/ui";
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
    <div className="size-full flex justify-center overflow-y-auto overflow-x-hidden vertical-scrollbar scrollbar-md">
      <div className="flex flex-col size-full xl:w-1/2 mt-6 xl:mt-20 px-5 md:px-10 xl:p-0 space-y-4">
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
        <div className="size-full ml-5">
          <DocumentReadOnlyEditorWithRef
            ref={editorRef}
            id={pageDetails.id}
            disabledExtensions={[]}
            initialValue={pageDetails.description_html ?? "<p></p>"}
            containerClassName="p-0 pb-64 border-none"
            fileHandler={getReadOnlyEditorFileHandlers({
              anchor,
            })}
            mentionHandler={{
              renderComponent: (props) => <EditorMentionsRoot {...props} />,
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
