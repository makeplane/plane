import { useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
// plane imports
import { TPageVersion } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { PageVersionsMainContent, TVersionEditorProps } from "@/components/pages";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// local imports
import { PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM, PAGE_NAVIGATION_PANE_WIDTH } from "../navigation-pane";

type Props = {
  editorComponent: React.FC<TVersionEditorProps>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
};

export const PageVersionsOverlay: React.FC<Props> = observer((props) => {
  const { editorComponent, fetchVersionDetails, handleRestore, pageId, restoreEnabled } = props;
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
        "absolute inset-0 z-[16] h-full bg-custom-background-100 flex overflow-hidden opacity-0 pointer-events-none transition-opacity",
        {
          "opacity-100 pointer-events-auto": isOpen,
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
      />
    </div>
  );
});
