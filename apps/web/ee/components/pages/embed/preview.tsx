import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TPage } from "@plane/types";
import { Avatar, Loader } from "@plane/ui";
import { calculateTimeAgo, cn, getFileURL, getPageName } from "@plane/utils";
// components
import { DocumentEditor } from "@/components/editor/document/editor";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { PageEmbedCardRoot } from "@/plane-web/components/pages";
import { EmbedHandler } from "@/plane-web/components/pages/editor/external-embed/embed-handler";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

type Props = {
  page: TPage;
  storeType: EPageStoreType;
  logo: React.ReactNode;
};

export const PageEmbedPreview: React.FC<Props> = observer((props) => {
  const { page, storeType, logo } = props;
  // params
  const { workspaceSlug, projectId } = useParams();
  const { fetchPageDetails } = usePageStore(storeType);
  // editor flaggings
  const { document: documentEditorExtensions } = useEditorFlagging({
    workspaceSlug: workspaceSlug?.toString() ?? "",
    storeType,
  });

  const { description_html, id, name, is_description_empty } = page;

  const { getUserDetails } = useMember();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug?.toString() ?? "");

  // State for handling transitions
  const [isLoading, setIsLoading] = useState(!is_description_empty && description_html == null);
  const [isContentVisible, setIsContentVisible] = useState(is_description_empty || description_html != null);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Animation effect on mount
  useEffect(() => {
    // On mount, start with opacity 0 and then animate in
    const animationFrame = requestAnimationFrame(() => {
      setIsAnimatedIn(true);
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    if (!page.id) return;

    const getPage = async () => {
      if (storeType === EPageStoreType.WORKSPACE) {
        // @ts-expect-error store fixes
        await fetchPageDetails(page.id, {
          shouldFetchSubPages: false,
          trackVisit: false,
        });
      }
    };

    // Always fetch the page details in the background
    getPage();
  }, [page.id, storeType, workspaceSlug, page, fetchPageDetails]);

  useEffect(() => {
    // If we have content or know it's empty, update the state
    if (description_html != null) {
      if (isLoading) {
        // If we were loading, fade out the loader and fade in the content
        const timer = setTimeout(() => {
          setIsLoading(false);
          // Small delay before showing content for smoother transition
          setTimeout(() => {
            setIsContentVisible(true);
          }, 150);
        }, 300);

        return () => clearTimeout(timer);
      } else if (!isContentVisible) {
        // If content is ready but not visible yet, make it visible
        setIsContentVisible(true);
      }
    }
  }, [description_html, is_description_empty, isLoading, isContentVisible]);

  const userDetails = getUserDetails(page.owned_by ?? "");

  return (
    <div
      ref={previewRef}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      className={cn(
        "absolute top-full left-0 z-10 w-80 bg-custom-background-100 shadow-custom-shadow-rg rounded-lg overflow-hidden max-h-[250px] cursor-default",
        "transition-all duration-200 transform origin-top-left",
        isAnimatedIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
      )}
      style={{
        animationFillMode: "forwards",
        transitionTimingFunction: "var(--ease-out-expo)",
      }}
    >
      <div className="relative h-full flex flex-col p-3.5">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-shrink-0">{logo}</div>
          <h4 className="text-sm font-medium truncate relative bottom-[5px]">{getPageName(name)}</h4>
        </div>

        <div className="flex-grow overflow-hidden" style={{ maxHeight: "120px" }}>
          <div
            className={cn(
              "transition-opacity duration-300 ease-in-out h-full",
              isLoading ? "opacity-100" : "opacity-0 hidden"
            )}
          >
            <Loader className="py-2">
              <div className="space-y-2">
                <div className="py-1">
                  <Loader.Item width="100%" height="15px" />
                </div>
                <Loader.Item width="80%" height="11px" />
                <div className="py-1">
                  <Loader.Item width="60%" height="11px" />
                </div>
                <div className="relative flex items-center gap-2 pt-2">
                  <Loader.Item width="30px" height="11px" />
                  <Loader.Item width="30%" height="11px" />
                  <Loader.Item width="20%" height="11px" />
                </div>
              </div>
            </Loader>
          </div>

          {/* Content */}
          {!is_description_empty && (
            <div
              className={cn(
                "transition-opacity duration-300 ease-in-out h-full",
                isContentVisible && !is_description_empty ? "opacity-100" : "opacity-0",
                !isLoading && !is_description_empty ? "block" : "hidden"
              )}
            >
              <div className="h-full overflow-hidden" id={`content-container-${id}`}>
                <DocumentEditor
                  editable={false}
                  id={id ?? ""}
                  value={description_html ?? "<p></p>"}
                  containerClassName="p-0 pl-3 border-none"
                  editorClassName="p-2.5 text-xs"
                  disabledExtensions={documentEditorExtensions.disabled}
                  flaggedExtensions={documentEditorExtensions.flagged}
                  displayConfig={{
                    fontSize: "small-font",
                  }}
                  embedHandler={{
                    page: {
                      widgetCallback: ({ pageId: pageIdFromNode }) => (
                        <PageEmbedCardRoot
                          embedPageId={pageIdFromNode}
                          previewDisabled
                          storeType={storeType}
                          isDroppable={false}
                        />
                      ),
                      workspaceSlug: workspaceSlug.toString(),
                    },
                  }}
                  projectId={projectId?.toString() ?? ""}
                  workspaceId={workspaceDetails?.id ?? ""}
                  workspaceSlug={workspaceSlug?.toString() ?? ""}
                />
              </div>

              <div
                className="absolute left-0 right-0 bottom-[50px] pointer-events-none h-20"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(var(--color-background-100),0) 0%, rgba(var(--color-background-100),0.95) 100%)",
                }}
              />
            </div>
          )}

          {/* Empty state message */}
          {is_description_empty && (
            <div
              className={cn(
                "h-full flex items-center justify-center text-custom-text-300 text-sm transition-opacity duration-300 ease-in-out cursor-default",
                isContentVisible && is_description_empty ? "opacity-100" : "opacity-0",
                !isLoading && is_description_empty ? "block" : "hidden"
              )}
            >
              {`This is an empty page. Why don't you write something inside and see it show up here like this placeholder
              text?`}
            </div>
          )}
        </div>

        {/* Footer - always visible */}
        <div className="flex items-center justify-between text-xs text-custom-text-300 pt-2.5 border-t border-custom-border-200 mt-2">
          <div className="flex items-center gap-1.5">
            <Avatar
              src={getFileURL(userDetails?.avatar_url ?? "")}
              name={userDetails?.display_name}
              size={18}
              showTooltip={false}
            />
            <span className="truncate max-w-[70px]">{userDetails?.display_name}</span>
          </div>
          <div>{page.updated_at && `Last updated ${calculateTimeAgo(page.updated_at)}`}</div>
        </div>
      </div>
    </div>
  );
});
