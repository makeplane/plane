import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// document-editor
import {
  CollaborativeDocumentEditorWithRef,
  CollaborativeDocumentReadOnlyEditorWithRef,
  EditorReadOnlyRefApi,
  EditorRefApi,
  TAIMenuProps,
  TDisplayConfig,
  TRealtimeConfig,
  TServerHandler,
} from "@plane/editor";
// types
import { IUserLite } from "@plane/types";
// components
import { Row } from "@plane/ui";
import { PageContentBrowser, PageContentLoader, PageEditorTitle } from "@/components/pages";
// helpers
import { cn, LIVE_BASE_PATH, LIVE_BASE_URL } from "@/helpers/common.helper";
import { generateRandomColor } from "@/helpers/string.helper";
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
  editorReady: boolean;
  handleConnectionStatus: (status: boolean) => void;
  handleEditorReady: (value: boolean) => void;
  handleReadOnlyEditorReady: (value: boolean) => void;
  page: IPage;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  sidePeekVisible: boolean;
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const {
    editorRef,
    handleConnectionStatus,
    handleEditorReady,
    handleReadOnlyEditorReady,
    page,
    readOnlyEditorRef,
    sidePeekVisible,
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
  const workspaceId = workspaceSlug ? (getWorkspaceBySlug(workspaceSlug.toString())?.id ?? "") : "";
  const pageId = page?.id;
  const pageTitle = page?.name ?? "";
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

  const handleServerConnect = useCallback(() => {
    handleConnectionStatus(false);
  }, []);

  const handleServerError = useCallback(() => {
    handleConnectionStatus(true);
  }, []);

  const serverHandler: TServerHandler = useMemo(
    () => ({
      onConnect: handleServerConnect,
      onServerError: handleServerError,
    }),
    []
  );

  const realtimeConfig: TRealtimeConfig | undefined = useMemo(() => {
    // Construct the WebSocket Collaboration URL
    try {
      const LIVE_SERVER_BASE_URL = LIVE_BASE_URL?.trim() || window.location.origin;
      const WS_LIVE_URL = new URL(LIVE_SERVER_BASE_URL);
      const isSecureEnvironment = window.location.protocol === "https:";
      WS_LIVE_URL.protocol = isSecureEnvironment ? "wss" : "ws";
      WS_LIVE_URL.pathname = `${LIVE_BASE_PATH}/collaboration`;
      // Construct realtime config
      return {
        url: WS_LIVE_URL.toString(),
        queryParams: {
          workspaceSlug: workspaceSlug?.toString(),
          projectId: projectId?.toString(),
          documentType: "project_page",
        },
      };
    } catch (error) {
      console.error("Error creating realtime config", error);
      return undefined;
    }
  }, [projectId, workspaceSlug]);

  if (pageId === undefined || !realtimeConfig) return <PageContentLoader />;

  return (
    <div className="flex items-center h-full w-full overflow-y-auto">
      <Row
        className={cn("sticky top-0 hidden h-full flex-shrink-0 -translate-x-full py-5 duration-200 md:block", {
          "translate-x-0": sidePeekVisible,
          "w-[10rem] lg:w-[14rem]": !isFullWidth,
          "w-[5%]": isFullWidth,
        })}
      >
        {!isFullWidth && (
          <PageContentBrowser editorRef={(isContentEditable ? editorRef : readOnlyEditorRef)?.current} />
        )}
      </Row>
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
            <CollaborativeDocumentEditorWithRef
              id={pageId}
              fileHandler={{
                cancel: fileService.cancelUpload,
                delete: fileService.getDeleteImageFunction(workspaceId),
                restore: fileService.getRestoreImageFunction(workspaceId),
                upload: fileService.getUploadFileFunction(workspaceSlug as string, setIsSubmitting),
              }}
              handleEditorReady={handleEditorReady}
              ref={editorRef}
              containerClassName="h-full p-0 pb-64"
              displayConfig={displayConfig}
              editorClassName="pl-10"
              mentionHandler={{
                highlights: mentionHighlights,
                suggestions: mentionSuggestions,
              }}
              embedHandler={{
                issue: issueEmbedProps,
              }}
              realtimeConfig={realtimeConfig}
              serverHandler={serverHandler}
              user={{
                id: currentUser?.id ?? "",
                name: currentUser?.display_name ?? "",
                color: generateRandomColor(currentUser?.id ?? ""),
              }}
              disabledExtensions={documentEditor}
              aiHandler={{
                menu: getAIMenu,
              }}
            />
          ) : (
            <CollaborativeDocumentReadOnlyEditorWithRef
              id={pageId}
              ref={readOnlyEditorRef}
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
              realtimeConfig={realtimeConfig}
              user={{
                id: currentUser?.id ?? "",
                name: currentUser?.display_name ?? "",
                color: generateRandomColor(currentUser?.id ?? ""),
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
