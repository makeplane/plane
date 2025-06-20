import { X } from "lucide-react";
// plane types
import { TPageVersion } from "@plane/types";
// components
import { PageVersionsSidebarList } from "@/components/pages";

type Props = {
  activeVersion: string | null;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  handleClose: () => void;
  isOpen: boolean;
  pageId: string;
};

export const PageVersionsSidebarRoot: React.FC<Props> = (props) => {
  const { activeVersion, fetchAllVersions, handleClose, isOpen, pageId } = props;

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
      <PageVersionsSidebarList
        activeVersion={activeVersion}
        fetchAllVersions={fetchAllVersions}
        isOpen={isOpen}
        pageId={pageId}
      />
    </div>
  );
};
