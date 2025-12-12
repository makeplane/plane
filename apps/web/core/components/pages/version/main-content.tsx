import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EyeIcon, TriangleAlert } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPageVersion } from "@plane/types";
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
// helpers
import type { EPageStoreType } from "@/plane-web/hooks/store";
// local imports
import type { TVersionEditorProps } from "./editor";

type Props = {
  activeVersion: string | null;
  editorComponent: React.FC<TVersionEditorProps>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleClose: () => void;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
  storeType: EPageStoreType;
};

export const PageVersionsMainContent = observer(function PageVersionsMainContent(props: Props) {
  const {
    activeVersion,
    editorComponent,
    fetchVersionDetails,
    handleClose,
    handleRestore,
    pageId,
    restoreEnabled,
    storeType,
  } = props;
  // states
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    data: versionDetails,
    error: versionDetailsError,
    mutate: mutateVersionDetails,
  } = useSWR(
    pageId && activeVersion ? `PAGE_VERSION_${activeVersion}` : null,
    pageId && activeVersion ? () => fetchVersionDetails(pageId, activeVersion) : null
  );

  const handleRestoreVersion = async () => {
    if (!restoreEnabled) return;
    setIsRestoring(true);
    await handleRestore(versionDetails?.description_html ?? "<p></p>")
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Page version restored.",
        });
        handleClose();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Failed to restore page version.",
        })
      )
      .finally(() => setIsRestoring(false));
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    await mutateVersionDetails();
    setIsRetrying(false);
  };

  const VersionEditor = editorComponent;

  return (
    <div className="flex-grow flex flex-col overflow-hidden">
      {versionDetailsError ? (
        <div className="flex-grow grid place-items-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex-shrink-0 grid place-items-center size-11 text-tertiary">
              <TriangleAlert className="size-10" />
            </span>
            <div>
              <h6 className="text-16 font-semibold">Something went wrong!</h6>
              <p className="text-13 text-tertiary">The version could not be loaded, please try again.</p>
            </div>
            <Button variant="link" onClick={handleRetry} loading={isRetrying}>
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-14 py-3 px-5 border-b border-subtle flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <h6 className="text-14 font-medium">
                {versionDetails
                  ? `${renderFormattedDate(versionDetails.last_saved_at)} ${renderFormattedTime(versionDetails.last_saved_at)}`
                  : "Loading version details"}
              </h6>
              <span className="flex-shrink-0 flex items-center gap-1 text-11 font-medium text-accent-primary bg-accent-primary/20 py-1 px-1.5 rounded-sm">
                <EyeIcon className="flex-shrink-0 size-3" />
                View only
              </span>
            </div>
            {restoreEnabled && (
              <Button variant="primary" className="flex-shrink-0" onClick={handleRestoreVersion} loading={isRestoring}>
                {isRestoring ? "Restoring" : "Restore"}
              </Button>
            )}
          </div>
          <div className="pt-8 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
            <VersionEditor activeVersion={activeVersion} storeType={storeType} versionDetails={versionDetails} />
          </div>
        </>
      )}
    </div>
  );
});
