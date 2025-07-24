import { observer } from "mobx-react";
// plane types
import { TPageVersion } from "@plane/types";
// components
import { PageVersionsMainContent, PageVersionsSidebarRoot, TVersionEditorProps } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
import { EPageStoreType } from "@/plane-web/hooks/store";

type Props = {
  activeVersion: string | null;
  currentVersionDescription: string | null;
  editorComponent: React.FC<TVersionEditorProps>;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  restoreEnabled: boolean;
  storeType: EPageStoreType;
};

export const PageVersionsOverlay: React.FC<Props> = observer((props) => {
  const {
    activeVersion,
    currentVersionDescription,
    editorComponent,
    fetchAllVersions,
    fetchVersionDetails,
    handleRestore,
    isOpen,
    onClose,
    pageId,
    restoreEnabled,
    storeType,
  } = props;

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className={cn(
        "absolute inset-0 z-[16] size-full bg-custom-background-100 flex overflow-hidden opacity-0 pointer-events-none transition-opacity",
        {
          "opacity-100 pointer-events-auto": isOpen,
        }
      )}
    >
      <PageVersionsMainContent
        activeVersion={activeVersion}
        currentVersionDescription={currentVersionDescription}
        editorComponent={editorComponent}
        fetchVersionDetails={fetchVersionDetails}
        handleClose={handleClose}
        handleRestore={handleRestore}
        pageId={pageId}
        restoreEnabled={restoreEnabled}
        storeType={storeType}
      />
      <PageVersionsSidebarRoot
        activeVersion={activeVersion}
        fetchAllVersions={fetchAllVersions}
        handleClose={handleClose}
        isOpen={isOpen}
        pageId={pageId}
      />
    </div>
  );
});
