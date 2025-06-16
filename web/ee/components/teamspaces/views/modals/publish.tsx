"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";
import { ExternalLink, Globe2 } from "lucide-react";
// plane imports
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@plane/constants";
import { TPublishViewSettings, TTeamspaceView } from "@plane/types";
import { Button, EModalWidth, Loader, ModalCore, TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// plane web hooks
import { useTeamspaceViews } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

type Props = {
  isOpen: boolean;
  view: TTeamspaceView;
  teamspaceId: string;
  onClose: () => void;
};

const defaultValues: TPublishViewSettings = {
  is_comments_enabled: false,
  is_reactions_enabled: false,
  is_votes_enabled: false,
};

export const PublishTeamspaceViewModal: React.FC<Props> = observer((props) => {
  const { isOpen, view, teamspaceId, onClose } = props;
  // states
  const [isUnPublishing, setIsUnPublishing] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { publishView, fetchPublishDetails, updatePublishedView, unPublishView } = useTeamspaceViews();
  const isViewsPublishEnabled = useFlag(workspaceSlug?.toString(), "VIEW_PUBLISH");
  // derived values
  const { data: publishedViewSettings, isLoading } = useSWR(
    view?.anchor ? `PUBLISHED_VIEW_${view.id}` : null,
    view?.anchor && isViewsPublishEnabled
      ? () => fetchPublishDetails(workspaceSlug.toString(), teamspaceId, view.id)
      : null
  );
  // form info
  const {
    control,
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues,
  });

  const handleClose = () => {
    onClose();
  };

  const handlePublishView = async (payload: TPublishViewSettings) => {
    if (!workspaceSlug || !view) return;
    await publishView(workspaceSlug.toString(), teamspaceId, view.id, payload);
  };

  const handleUpdatePublishSettings = async (payload: Partial<TPublishViewSettings>) => {
    if (!workspaceSlug || !view) return;

    await updatePublishedView(workspaceSlug.toString(), teamspaceId, view.id, payload).then((res) => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Publish settings updated successfully!",
      });

      handleClose();
      return res;
    });
  };

  const handleUnPublishView = async () => {
    if (!workspaceSlug || !view) return;

    setIsUnPublishing(true);

    await unPublishView(workspaceSlug.toString(), teamspaceId, view.id)
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong while unpublishing the View.",
        })
      )
      .finally(() => setIsUnPublishing(false));
  };

  const handleFormSubmit = async (formData: Partial<TPublishViewSettings>) => {
    const payload: TPublishViewSettings = {
      is_comments_enabled: !!formData.is_comments_enabled,
      is_reactions_enabled: !!formData.is_reactions_enabled,
      is_votes_enabled: !!formData.is_votes_enabled,
    };

    if (view.anchor) await handleUpdatePublishSettings(payload);
    else await handlePublishView(payload);
  };

  // prefill form values for already published views
  useEffect(() => {
    if (!publishedViewSettings?.anchor) return;

    reset({
      ...defaultValues,
      ...publishedViewSettings,
    });
  }, [publishedViewSettings, reset]);

  const SPACE_APP_URL = (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
  const publishLink = `${SPACE_APP_URL}/views/${publishedViewSettings?.anchor}`;

  const handleCopyLink = () =>
    copyTextToClipboard(publishLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "",
        message: "Published page link copied successfully.",
      })
    );

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="flex items-center justify-between gap-2 p-5">
          <h5 className="text-xl font-medium text-custom-text-200">Publish views</h5>
          {view.anchor && (
            <Button variant="danger" onClick={() => handleUnPublishView()} loading={isUnPublishing}>
              {isUnPublishing ? "Unpublishing" : "Unpublish"}
            </Button>
          )}
        </div>
        {/* content */}
        {isLoading ? (
          <Loader className="space-y-4 px-5">
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
          </Loader>
        ) : (
          <div className="px-5 space-y-4">
            {view.anchor && publishedViewSettings && (
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
                <p className="text-sm font-medium text-custom-primary-100 flex items-center gap-1 mt-3">
                  <span className="relative grid place-items-center size-2.5">
                    <span className="animate-ping absolute inline-flex size-full rounded-full bg-custom-primary-100 opacity-75" />
                    <span className="relative inline-flex rounded-full size-1.5 bg-custom-primary-100" />
                  </span>
                  This View is now live on web
                </p>
              </>
            )}
            <div className="space-y-4">
              <div className="relative flex items-center justify-between gap-2">
                <div className="text-sm">Allow comments</div>
                <Controller
                  control={control}
                  name="is_comments_enabled"
                  render={({ field: { onChange, value } }) => (
                    <ToggleSwitch value={!!value} onChange={onChange} size="sm" />
                  )}
                />
              </div>
              <div className="relative flex items-center justify-between gap-2">
                <div className="text-sm">Allow reactions</div>
                <Controller
                  control={control}
                  name="is_reactions_enabled"
                  render={({ field: { onChange, value } }) => (
                    <ToggleSwitch value={!!value} onChange={onChange} size="sm" />
                  )}
                />
              </div>
              <div className="relative flex items-center justify-between gap-2">
                <div className="text-sm">Allow voting</div>
                <Controller
                  control={control}
                  name="is_votes_enabled"
                  render={({ field: { onChange, value } }) => (
                    <ToggleSwitch value={!!value} onChange={onChange} size="sm" />
                  )}
                />
              </div>
            </div>
          </div>
        )}
        {/* modal handlers */}
        <div className="relative flex items-center justify-between border-t border-custom-border-200 px-5 py-4 mt-4">
          <div className="flex items-center gap-1 text-sm text-custom-text-400">
            <Globe2 className="size-3.5" />
            <div className="text-sm">Anyone with the link can access</div>
          </div>
          {!isLoading && (
            <div className="relative flex items-center gap-2">
              <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              {view.anchor ? (
                isDirty && (
                  <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                    {isSubmitting ? "Updating" : "Update settings"}
                  </Button>
                )
              ) : (
                <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
                  {isSubmitting ? "Publishing" : "Publish"}
                </Button>
              )}
            </div>
          )}
        </div>
      </form>
    </ModalCore>
  );
});
