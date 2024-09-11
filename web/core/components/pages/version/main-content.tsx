import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { TriangleAlert } from "lucide-react";
// plane types
import { TPageVersion } from "@plane/types";
// plane ui
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { TVersionEditorProps } from "@/components/pages";
// helpers
import { renderFormattedDate, renderFormattedTime } from "@/helpers/date-time.helper";

type Props = {
  activeVersion: string | null;
  currentVersionDescription: string | null;
  editorComponent: React.FC<TVersionEditorProps>;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleClose: () => void;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  pageId: string;
  restoreEnabled: boolean;
};

export const PageVersionsMainContent: React.FC<Props> = observer((props) => {
  const {
    activeVersion,
    currentVersionDescription,
    editorComponent,
    fetchVersionDetails,
    handleClose,
    handleRestore,
    pageId,
    restoreEnabled,
  } = props;
  // states
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    data: versionDetails,
    error: versionDetailsError,
    mutate: mutateVersionDetails,
  } = useSWR(
    pageId && activeVersion && activeVersion !== "current" ? `PAGE_VERSION_${activeVersion}` : null,
    pageId && activeVersion && activeVersion !== "current" ? () => fetchVersionDetails(pageId, activeVersion) : null
  );

  const isCurrentVersionActive = activeVersion === "current";

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
            <h6 className="text-base font-medium">
              {isCurrentVersionActive
                ? "Current version"
                : versionDetails
                  ? `${renderFormattedDate(versionDetails.last_saved_at)} ${renderFormattedTime(versionDetails.last_saved_at)}`
                  : "Loading version details"}
            </h6>
            {!isCurrentVersionActive && restoreEnabled && (
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
            <VersionEditor
              activeVersion={activeVersion}
              currentVersionDescription={currentVersionDescription}
              isCurrentVersionActive={isCurrentVersionActive}
              versionDetails={versionDetails}
            />
          </div>
        </>
      )}
    </div>
  );
});
