"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Check, ExternalLink, Globe2 } from "lucide-react";
// types
import { IProject, TProjectPublishLayouts, TProjectPublishSettings } from "@plane/types";
// ui
import { Button, Loader, ToggleSwitch, TOAST_TYPE, setToast, CustomSelect, ModalCore, EModalWidth } from "@plane/ui";
// helpers
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@/helpers/common.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useProjectPublish } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  project: IProject;
  onClose: () => void;
};

const defaultValues: Partial<TProjectPublishSettings> = {
  is_comments_enabled: false,
  is_reactions_enabled: false,
  is_votes_enabled: false,
  inbox: null,
  view_props: {
    list: true,
    kanban: true,
  },
};

const VIEW_OPTIONS: {
  key: TProjectPublishLayouts;
  label: string;
}[] = [
  { key: "list", label: "List" },
  { key: "kanban", label: "Kanban" },
];

export const PublishProjectModal: React.FC<Props> = observer((props) => {
  const { isOpen, project, onClose } = props;
  // states
  const [isUnPublishing, setIsUnPublishing] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    fetchPublishSettings,
    getPublishSettingsByProjectID,
    publishProject,
    updatePublishSettings,
    unPublishProject,
    fetchSettingsLoader,
  } = useProjectPublish();
  // derived values
  const projectPublishSettings = getPublishSettingsByProjectID(project.id);
  // form info
  const {
    control,
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    defaultValues,
  });

  const handleClose = () => {
    onClose();
  };

  // fetch publish settings
  useEffect(() => {
    if (!workspaceSlug || !isOpen) return;

    if (!projectPublishSettings) {
      fetchPublishSettings(workspaceSlug.toString(), project.id);
    }
  }, [fetchPublishSettings, isOpen, project, projectPublishSettings, workspaceSlug]);

  const handlePublishProject = async (payload: Partial<TProjectPublishSettings>) => {
    if (!workspaceSlug) return;
    await publishProject(workspaceSlug.toString(), project.id, payload);
  };

  const handleUpdatePublishSettings = async (payload: Partial<TProjectPublishSettings>) => {
    if (!workspaceSlug || !payload.id) return;

    await updatePublishSettings(workspaceSlug.toString(), project.id, payload.id, payload).then((res) => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Publish settings updated successfully!",
      });

      handleClose();
      return res;
    });
  };

  const handleUnPublishProject = async (publishId: string) => {
    if (!workspaceSlug || !publishId) return;

    setIsUnPublishing(true);

    await unPublishProject(workspaceSlug.toString(), project.id, publishId)
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong while unpublishing the project.",
        })
      )
      .finally(() => setIsUnPublishing(false));
  };

  const selectedLayouts = Object.entries(watch("view_props") ?? {})
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([key, value]) => value)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(([key, value]) => key)
    .filter((l) => VIEW_OPTIONS.find((o) => o.key === l));

  const handleFormSubmit = async (formData: Partial<TProjectPublishSettings>) => {
    if (!selectedLayouts || selectedLayouts.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one view layout to publish the project.",
      });
      return;
    }

    const payload: Partial<TProjectPublishSettings> = {
      id: formData.id,
      is_comments_enabled: formData.is_comments_enabled,
      is_reactions_enabled: formData.is_reactions_enabled,
      is_votes_enabled: formData.is_votes_enabled,
      view_props: formData.view_props,
    };

    if (formData.id && project.anchor) await handleUpdatePublishSettings(payload);
    else await handlePublishProject(payload);
  };

  // prefill form values for already published projects
  useEffect(() => {
    if (!projectPublishSettings?.anchor) return;

    reset({
      ...defaultValues,
      ...projectPublishSettings,
    });
  }, [projectPublishSettings, reset]);

  const SPACE_APP_URL = (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
  const publishLink = `${SPACE_APP_URL}/issues/${projectPublishSettings?.anchor}`;

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
          <h5 className="text-xl font-medium text-custom-text-200">Publish project</h5>
          {project.anchor && (
            <Button variant="danger" onClick={() => handleUnPublishProject(watch("id") ?? "")} loading={isUnPublishing}>
              {isUnPublishing ? "Unpublishing" : "Unpublish"}
            </Button>
          )}
        </div>

        {/* content */}
        {fetchSettingsLoader ? (
          <Loader className="space-y-4 px-5">
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
          </Loader>
        ) : (
          <div className="px-5 space-y-4">
            {project.anchor && projectPublishSettings && (
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
                  This project is now live on web
                </p>
              </>
            )}
            <div className="space-y-4">
              <div className="relative flex items-center justify-between gap-2">
                <div className="text-sm">Views</div>
                <Controller
                  control={control}
                  name="view_props"
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      value={value}
                      label={VIEW_OPTIONS.filter((o) => selectedLayouts.includes(o.key))
                        .map((o) => o.label)
                        .join(", ")}
                      onChange={(val: TProjectPublishLayouts) => {
                        if (selectedLayouts.length === 1 && selectedLayouts[0] === val) return;
                        onChange({
                          ...value,
                          [val]: !value?.[val],
                        });
                      }}
                      buttonClassName="border-none"
                      placement="bottom-end"
                    >
                      {VIEW_OPTIONS.map((option) => (
                        <CustomSelect.Option
                          key={option.key}
                          value={option.key}
                          className="flex items-center justify-between gap-2"
                        >
                          {option.label}
                          {selectedLayouts.includes(option.key) && <Check className="size-3.5 flex-shrink-0" />}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              </div>
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
          {!fetchSettingsLoader && (
            <div className="relative flex items-center gap-2">
              <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              {project.anchor ? (
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
