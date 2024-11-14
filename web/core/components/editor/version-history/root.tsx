import { observer } from "mobx-react";
// plane types
import { TEditorVersion } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
// local components
import { EditorVersionHistoryMainContent, EditorVersionHistorySidebarRoot, TVersionEditorProps } from ".";

type Props = {
  activeVersion: string | null;
  currentVersionDescription: string | null;
  editorComponent: React.FC<TVersionEditorProps>;
  entityId: string;
  fetchAllVersions: (entityId: string) => Promise<TEditorVersion[] | undefined>;
  fetchVersionDetails: (entityId: string, versionId: string) => Promise<TEditorVersion | undefined>;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  restoreEnabled: boolean;
};

export const EditorVersionHistoryOverlay: React.FC<Props> = observer((props) => {
  const {
    activeVersion,
    currentVersionDescription,
    editorComponent,
    entityId,
    fetchAllVersions,
    fetchVersionDetails,
    handleRestore,
    isOpen,
    onClose,
    restoreEnabled,
  } = props;

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 size-full bg-custom-background-100 flex overflow-hidden opacity-0 pointer-events-none transition-opacity",
        {
          "opacity-100 pointer-events-auto": isOpen,
        }
      )}
    >
      <EditorVersionHistoryMainContent
        activeVersion={activeVersion}
        currentVersionDescription={currentVersionDescription}
        editorComponent={editorComponent}
        entityId={entityId}
        fetchVersionDetails={fetchVersionDetails}
        handleClose={handleClose}
        handleRestore={handleRestore}
        restoreEnabled={restoreEnabled}
      />
      <EditorVersionHistorySidebarRoot
        activeVersion={activeVersion}
        entityId={entityId}
        fetchAllVersions={fetchAllVersions}
        handleClose={handleClose}
        isOpen={isOpen}
      />
    </div>
  );
});
