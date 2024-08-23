import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane types
import { TPageVersion } from "@plane/types";
// plane ui
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { PagesVersionEditor } from "@/components/pages";
// helpers
import { renderFormattedDate, renderFormattedTime } from "@/helpers/date-time.helper";

type Props = {
  activeVersion: string | null;
  fetchVersionDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  handleClose: () => void;
  handleRestore: (descriptionHTML: string) => Promise<void>;
  pageId: string;
};

export const PageVersionsMainContent: React.FC<Props> = observer((props) => {
  const { activeVersion, fetchVersionDetails, handleClose, handleRestore, pageId } = props;
  // states
  const [isRestoring, setIsRestoring] = useState(false);

  const { data: versionDetails } = useSWR(
    pageId && activeVersion && activeVersion !== "current" ? `PAGE_VERSION_${activeVersion}` : null,
    pageId && activeVersion && activeVersion !== "current" ? () => fetchVersionDetails(pageId, activeVersion) : null
  );

  const isCurrentVersionActive = activeVersion === "current";

  const handleRestoreVersion = async () => {
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

  return (
    <div className="flex-grow flex flex-col">
      <div className="min-h-14 py-3 px-5 border-b border-custom-border-200 flex items-center justify-between gap-2">
        <h6 className="text-base font-medium">
          {isCurrentVersionActive
            ? "Current version"
            : versionDetails
              ? `${renderFormattedDate(versionDetails.last_saved_at)} ${renderFormattedTime(versionDetails.last_saved_at)}`
              : "Loading version details"}
        </h6>
        {!isCurrentVersionActive && (
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
        <PagesVersionEditor
          activeVersion={activeVersion}
          isCurrentVersionActive={isCurrentVersionActive}
          versionDetails={versionDetails}
        />
      </div>
    </div>
  );
});
