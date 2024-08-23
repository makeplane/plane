import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// document-editor
import {
  DocumentEditorWithRef,
  DocumentReadOnlyEditorWithRef,
  EditorReadOnlyRefApi,
  EditorRefApi,
  IMarking,
  TAIMenuProps,
  TDisplayConfig,
} from "@plane/editor";
// types
import { IUserLite } from "@plane/types";
// components
import { PageContentBrowser, PageContentLoader, PageEditorTitle } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMember, useMention, useUser, useWorkspace } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { EditorAIMenu } from "@/plane-web/components/pages";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { useIssueEmbed } from "@/plane-web/hooks/use-issue-embed";
// services
import { FileService } from "@/services/file.service";
// store
import { IPage } from "@/store/pages/page";

const fileService = new FileService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  markings: IMarking[];
  page: IPage;
  sidePeekVisible: boolean;
  handleEditorReady: (value: boolean) => void;
  handleReadOnlyEditorReady: (value: boolean) => void;
  updateMarkings: (description_html: string) => void;
  handleDescriptionChange: (update: Uint8Array, source?: string | undefined) => void;
  isDescriptionReady: boolean;
  pageDescriptionYJS: Uint8Array | undefined;
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const {
    handleReadOnlyEditorReady,
    handleEditorReady,
    editorRef,
    markings,
    readOnlyEditorRef,
    page,
    sidePeekVisible,
    updateMarkings,
    handleDescriptionChange,
    isDescriptionReady,
    pageDescriptionYJS,
  } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  // derived values
  const workspaceId = workspaceSlug ? getWorkspaceBySlug(workspaceSlug.toString())?.id ?? "" : "";
  const pageId = page?.id;
  const pageTitle = page?.name ?? "";
  const pageDescription = page?.description_html;
  const { isContentEditable, updateTitle, setIsSubmitting } = page;
  const projectMemberIds = projectId ? getProjectMemberIds(projectId.toString()) : [];
  const projectMemberDetails = projectMemberIds?.map((id) => getUserDetails(id) as IUserLite);
  // use-mention
  const { mentionHighlights, mentionSuggestions } = useMention({
    workspaceSlug: workspaceSlug?.toString() ?? "",
    projectId: projectId?.toString() ?? "",
    members: projectMemberDetails,
    user: currentUser ?? undefined,
  });
  // editor flaggings
  const { documentEditor } = useEditorFlagging();
  // page filters
  const { fontSize, fontStyle, isFullWidth } = usePageFilters();
  // issue-embed
  const { issueEmbedProps } = useIssueEmbed(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "");

  const displayConfig: TDisplayConfig = {
    fontSize,
    fontStyle,
  };

  const getAIMenu = useCallback(
    ({ isOpen, onClose }: TAIMenuProps) => <EditorAIMenu editorRef={editorRef} isOpen={isOpen} onClose={onClose} />,
    [editorRef]
  );

  useEffect(() => {
    updateMarkings(pageDescription ?? "<p></p>");
  }, [pageDescription, updateMarkings]);

  if (pageId === undefined || pageDescription === undefined || !pageDescriptionYJS || !isDescriptionReady)
    return <PageContentLoader />;

  return (
    <div className="flex items-center h-full w-full overflow-y-auto">
      <div
        className={cn("sticky top-0 hidden h-full flex-shrink-0 -translate-x-full p-5 duration-200 md:block", {
          "translate-x-0": sidePeekVisible,
          "w-[10rem] lg:w-[14rem]": !isFullWidth,
          "w-[5%]": isFullWidth,
        })}
      >
        {!isFullWidth && (
          <PageContentBrowser
            editorRef={(isContentEditable ? editorRef : readOnlyEditorRef)?.current}
            markings={markings}
          />
        )}
      </div>
      <div
        className={cn("h-full w-full pt-5 duration-200", {
          "md:w-[calc(100%-10rem)] xl:w-[calc(100%-28rem)]": !isFullWidth,
          "md:w-[90%]": isFullWidth,
        })}
      >
        <div className="h-full w-full flex flex-col gap-y-7 overflow-y-auto overflow-x-hidden">
          <div className="relative w-full flex-shrink-0 md:pl-5 px-4">
            <PageEditorTitle
              editorRef={editorRef}
              title={pageTitle}
              updateTitle={updateTitle}
              readOnly={!isContentEditable}
            />
          </div>
          {isContentEditable ? (
            <DocumentEditorWithRef
              id={pageId}
              fileHandler={{
                cancel: fileService.cancelUpload,
                delete: fileService.getDeleteImageFunction(workspaceId),
                restore: fileService.getRestoreImageFunction(workspaceId),
                upload: fileService.getUploadFileFunction(workspaceSlug as string, setIsSubmitting),
              }}
              handleEditorReady={handleEditorReady}
              value={pageDescriptionYJS}
              ref={editorRef}
              containerClassName="p-0 pb-64"
              displayConfig={displayConfig}
              editorClassName="pl-10"
              onChange={handleDescriptionChange}
              mentionHandler={{
                highlights: mentionHighlights,
                suggestions: mentionSuggestions,
              }}
              embedHandler={{
                issue: issueEmbedProps,
              }}
              disabledExtensions={documentEditor}
              aiHandler={{
                menu: getAIMenu,
              }}
            />
          ) : (
            <DocumentReadOnlyEditorWithRef
              ref={readOnlyEditorRef}
              id={pageId}
              initialValue={pageDescription ?? "<p></p>"}
              handleEditorReady={handleReadOnlyEditorReady}
              containerClassName="p-0 pb-64 border-none"
              displayConfig={displayConfig}
              editorClassName="pl-10"
              mentionHandler={{
                highlights: mentionHighlights,
              }}
              embedHandler={{
                issue: {
                  widgetCallback: issueEmbedProps.widgetCallback,
                },
              }}
            />
          )}
        </div>
      </div>
      <div
        className={cn("hidden xl:block flex-shrink-0 duration-200", {
          "w-[10rem] lg:w-[14rem]": !isFullWidth,
          "w-[5%]": isFullWidth,
        })}
      />
    </div>
  );
});
