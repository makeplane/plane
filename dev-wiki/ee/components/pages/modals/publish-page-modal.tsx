import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, Globe2 } from "lucide-react";
// ui
import { Button, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@/helpers/common.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
// plane web types
import { TPagePublishSettings } from "@/plane-web/types/pages";

type Props = {
  anchor: string | null | undefined;
  fetchPagePublishSettings: () => Promise<TPagePublishSettings>;
  isOpen: boolean;
  onClose: () => void;
  pagePublishSettings: TPagePublishSettings | undefined;
  publishPage: (data: Partial<TPagePublishSettings>) => Promise<TPagePublishSettings>;
  unpublishPage: () => Promise<void>;
};

export const PublishPageModal: React.FC<Props> = observer((props) => {
  const { anchor, fetchPagePublishSettings, isOpen, onClose, pagePublishSettings, publishPage, unpublishPage } = props;
  // states
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  // derived values
  const isDeployed = !!anchor;

  const handleClose = () => {
    onClose();
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    await publishPage({})
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be published. Please try again later.",
        });
      })
      .finally(() => setIsPublishing(false));
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    await unpublishPage()
      .then(() => handleClose())
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be unpublished. Please try again later.",
        });
      })
      .finally(() => setIsUnpublishing(false));
  };

  const SPACE_APP_URL = SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL;
  const publishLink = `${SPACE_APP_URL}${SPACE_BASE_PATH}/pages/${pagePublishSettings?.anchor}`;
  const handleCopyLink = () =>
    copyTextToClipboard(publishLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "",
        message: "Published page link copied successfully.",
      })
    );

  useEffect(() => {
    if (isDeployed && !pagePublishSettings) {
      fetchPagePublishSettings();
    }
  }, [fetchPagePublishSettings, isDeployed, pagePublishSettings]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXL}>
      <div className="p-5 space-y-4">
        <div className="text-xl font-medium text-custom-text-200">Publish page</div>
        {isDeployed ? (
          <>
            <div className="bg-custom-background-80 border border-custom-border-300 rounded-md py-1.5 pl-4 pr-1 flex items-center justify-between gap-2">
              <a
                href={publishLink}
                className="text-sm text-custom-text-200 truncate"
                target="_blank"
                rel="noopener noreferrer"
              >
                {publishLink}
              </a>
              <div className="flex-shrink-0 flex items-center gap-1">
                <a
                  href={publishLink}
                  className="size-8 grid place-items-center bg-custom-background-90 hover:bg-custom-background-100 rounded"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                </a>
                <button
                  type="button"
                  className="h-8 bg-custom-background-90 hover:bg-custom-background-100 rounded text-xs font-medium py-2 px-3"
                  onClick={handleCopyLink}
                >
                  Copy link
                </button>
              </div>
            </div>

            <p className="text-sm font-medium text-custom-primary-100 flex items-center gap-1">
              <span className="flex-shrink-0 relative grid place-items-center size-2.5">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-custom-primary-100 opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-custom-primary-100" />
              </span>
              This page is now live
            </p>
          </>
        ) : (
          <p className="text-sm text-custom-text-200">Generate a public URL to share this page.</p>
        )}
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-2 border-t-[0.5px] border-custom-border-200">
        <div className="flex items-center gap-1 text-sm text-custom-text-400">
          <Globe2 className="size-3.5" />
          <p className="text-sm">Anyone with the link can access</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          {isDeployed ? (
            <Button variant="outline-primary" size="sm" onClick={handleUnpublish} loading={isUnpublishing} tabIndex={1}>
              {isUnpublishing ? "Unpublishing" : "Unpublish"}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handlePublish} loading={isPublishing} tabIndex={1}>
              {isPublishing ? "Publishing" : "Publish"}
            </Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
