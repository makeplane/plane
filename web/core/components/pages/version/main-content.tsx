import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EyeIcon, TriangleAlert } from "lucide-react";
// plane types
import { TPageVersion } from "@plane/types";
// plane ui
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { renderFormattedDate, renderFormattedTime } from "@plane/utils";
import { TVersionEditorProps } from "@/components/pages";
// helpers

type Props = {
  activeVersion: string | null;
  editorComponent: React.FC<TVersionEditorProps>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleClose: () => void;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
};

export const PageVersionsMainContent: React.FC<Props> = observer((props) => {
  const { activeVersion, editorComponent, fetchVersionDetails, handleClose, handleRestore, pageId, restoreEnabled } =
    props;
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
            <span className="flex-shrink-0 grid place-items-center size-11 text-custom-text-300">
              <TriangleAlert className="size-10" />
            </span>
            <div>
              <h6 className="text-lg font-semibold">Something went wrong!</h6>
              <p className="text-sm text-custom-text-300">The version could not be loaded, please try again.</p>
            </div>
            <Button variant="link-primary" onClick={handleRetry} loading={isRetrying}>
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-14 py-3 px-5 border-b border-custom-border-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <h6 className="text-base font-medium">
                {versionDetails
                  ? `${renderFormattedDate(versionDetails.last_saved_at)} ${renderFormattedTime(versionDetails.last_saved_at)}`
                  : "Loading version details"}
              </h6>
              <span className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-custom-primary-100 bg-custom-primary-100/20 py-1 px-1.5 rounded">
                <EyeIcon className="flex-shrink-0 size-3" />
                View only
              </span>
            </div>
            {restoreEnabled && (
              <Button
                variant="primary"
                size="sm"
                className="flex-shrink-0"
                onClick={handleRestoreVersion}
                loading={isRestoring}
              >
                {isRestoring ? "Restoring" : "Restore"}
              </Button>
            )}
          </div>
          <div className="pt-8 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
            <VersionEditor activeVersion={activeVersion} versionDetails={versionDetails} />
          </div>
        </>
      )}
    </div>
  );
});
