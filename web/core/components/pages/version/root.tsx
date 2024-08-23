import useSWR from "swr";
// plane types
import { TPageVersion } from "@plane/types";
// components
import { PageVersionsMainContent, PageVersionsSidebar } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  activeVersion: string | null;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
};

export const PageVersionsOverlay: React.FC<Props> = (props) => {
  const { activeVersion, fetchAllVersions, fetchVersionDetails, handleRestore, isOpen, onClose, pageId } = props;

  const { data: versionsList } = useSWR(
    pageId && isOpen ? `PAGE_VERSIONS_LIST_${pageId}` : null,
    pageId && isOpen ? () => fetchAllVersions(pageId) : null
  );

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 size-full bg-custom-background-100 flex overflow-hidden opacity-0 pointer-events-none transition-opacity",
        {
          "opacity-100 pointer-events-auto": isOpen,
        }
      )}
    >
      <PageVersionsMainContent
        activeVersion={activeVersion}
        fetchVersionDetails={fetchVersionDetails}
        handleClose={handleClose}
        handleRestore={handleRestore}
        pageId={pageId}
      />
      <PageVersionsSidebar activeVersion={activeVersion} handleClose={handleClose} versions={versionsList} />
    </div>
  );
};
