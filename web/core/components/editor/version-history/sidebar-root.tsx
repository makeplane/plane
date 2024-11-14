import { X } from "lucide-react";
// plane types
import { TEditorVersion } from "@plane/types";
// local components
import { EditorVersionHistorySidebarList } from ".";

type Props = {
  activeVersion: string | null;
  entityId: string;
  fetchAllVersions: (entityId: string) => Promise<TEditorVersion[] | undefined>;
  handleClose: () => void;
  isOpen: boolean;
};

export const EditorVersionHistorySidebarRoot: React.FC<Props> = (props) => {
  const { activeVersion, entityId, fetchAllVersions, handleClose, isOpen } = props;

  return (
    <div className="flex-shrink-0 py-4 border-l border-custom-border-200 flex flex-col">
      <div className="px-6 flex items-center justify-between gap-2">
        <h5 className="text-base font-semibold">Version history</h5>
        <button
          type="button"
          onClick={handleClose}
          className="flex-shrink-0 size-6 grid place-items-center text-custom-text-300 hover:text-custom-text-100 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
      <EditorVersionHistorySidebarList
        activeVersion={activeVersion}
        entityId={entityId}
        fetchAllVersions={fetchAllVersions}
        isOpen={isOpen}
      />
    </div>
  );
};
