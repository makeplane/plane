/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

// types
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@plane/constants";
import { Button } from "@makeplane/propel/components/button";
import { GlobeOutline, NewTabOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import type { TProjectPublishLayouts, TProjectPublishSettings } from "@plane/types";
// ui
import { Switch } from "@makeplane/propel/components/switch";
import { Select } from "@plane/blocks/select";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogInfo,
  DialogInfoIcon,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { Loader } from "@plane/blocks/skeleton";
// helpers
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { useProjectPublish } from "@/hooks/store/use-project-publish";

type Props = {
  isOpen: boolean;
  projectId: string;
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

type TViewOption = {
  key: TProjectPublishLayouts;
  label: string;
};

const VIEW_OPTIONS: TViewOption[] = [
  { key: "list", label: "List" },
  { key: "kanban", label: "Kanban" },
];

export const PublishProjectModal = observer(function PublishProjectModal(props: Props) {
  const { isOpen, onClose, projectId } = props;
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
  const projectPublishSettings = getPublishSettingsByProjectID(projectId);
  const isProjectPublished = !!projectPublishSettings?.anchor;
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
      fetchPublishSettings(workspaceSlug.toString(), projectId);
    }
  }, [fetchPublishSettings, isOpen, projectId, projectPublishSettings, workspaceSlug]);

  const handlePublishProject = async (payload: Partial<TProjectPublishSettings>) => {
    if (!workspaceSlug) return;
    await publishProject(workspaceSlug.toString(), projectId, payload);
  };

  const handleUpdatePublishSettings = async (payload: Partial<TProjectPublishSettings>) => {
    if (!workspaceSlug || !payload.id) return;

    await updatePublishSettings(workspaceSlug.toString(), projectId, payload.id, payload).then((res) => {
      setToast({
        type: "success",
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

    await unPublishProject(workspaceSlug.toString(), projectId, publishId)
      .catch(() =>
        setToast({
          type: "error",
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
        type: "error",
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

    if (formData.id && isProjectPublished) await handleUpdatePublishSettings(payload);
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

  const SPACE_APP_URL =
    (SPACE_BASE_URL.trim() === "" && typeof window !== "undefined" ? window.location.origin : SPACE_BASE_URL) +
    SPACE_BASE_PATH;
  const publishLink = `${SPACE_APP_URL}/issues/${projectPublishSettings?.anchor}`;

  const handleCopyLink = () =>
    copyTextToClipboard(publishLink).then(() =>
      setToast({
        type: "success",
        title: "",
        message: "Published page link copied successfully.",
      })
    );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <DialogHeading>
                  <DialogTitle>Publish project</DialogTitle>
                </DialogHeading>
                {isProjectPublished && (
                  <Button
                    variant="danger"
                    size="md"
                    stretch="auto"
                    label={isUnPublishing ? "Unpublishing" : "Unpublish"}
                    onClick={() => void handleUnPublishProject(watch("id") ?? "")}
                    loading={isUnPublishing}
                  />
                )}
              </div>
            </DialogHeader>

            {/* content */}
            <DialogBody>
              {fetchSettingsLoader ? (
                <Loader className="space-y-4">
                  <Loader.Item height="30px" />
                  <Loader.Item height="30px" />
                  <Loader.Item height="30px" />
                  <Loader.Item height="30px" />
                </Loader>
              ) : (
                <div className="space-y-4">
                  {isProjectPublished && projectPublishSettings && (
                    <>
                      <div className="flex items-center justify-between gap-2 rounded-md border border-strong py-1.5 pr-1 pl-4">
                        <a
                          href={publishLink}
                          className="truncate text-13 text-secondary"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {publishLink}
                        </a>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          <a
                            href={publishLink}
                            aria-label="Open in new tab"
                            className="grid size-8 place-items-center rounded-sm bg-layer-3 hover:bg-layer-3-hover"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <NewTabOutline className="size-4" />
                          </a>
                          <button
                            type="button"
                            className="h-8 rounded-sm bg-layer-3 px-3 py-2 text-11 font-medium hover:bg-layer-3-hover"
                            onClick={() => void handleCopyLink()}
                          >
                            Copy link
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 flex items-center gap-1 text-13 font-medium text-accent-primary">
                        <span className="relative grid size-2.5 place-items-center">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-primary opacity-75" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-accent-primary" />
                        </span>
                        This project is now live on web
                      </p>
                    </>
                  )}
                  <div className="space-y-4">
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="text-13">Views</div>
                      <Controller
                        control={control}
                        name="view_props"
                        render={({ field: { onChange, value } }) => (
                          // `select-ghost-*` chrome is `w-full`; the shrink-0 wrapper keeps the
                          // trigger content-width inside the settings row, as the old button was.
                          <span className="flex shrink-0">
                            <Select<TViewOption>
                              multiple
                              getValues={() => VIEW_OPTIONS}
                              value={VIEW_OPTIONS.filter((o) => selectedLayouts.includes(o.key))}
                              onChange={(keys) => {
                                // The old dropdown refused to unset the last remaining layout; a
                                // publish needs at least one, so an empty selection is a no-op.
                                if (keys.length === 0) return;
                                onChange({
                                  ...value,
                                  ...Object.fromEntries(VIEW_OPTIONS.map((o) => [o.key, keys.includes(o.key)])),
                                });
                              }}
                              getOptionValue={(option) => option.key}
                              getOptionLabel={(option) => option.label}
                              showSearch={false}
                              pinSelected={false}
                            >
                              <Select.Trigger<TViewOption> variant="select-ghost-md">
                                {(options) => (
                                  <span className="min-w-0 grow truncate text-left">
                                    {options.map((o) => o.label).join(", ")}
                                  </span>
                                )}
                              </Select.Trigger>
                            </Select>
                          </span>
                        )}
                      />
                    </div>
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="text-13">Allow comments</div>
                      <Controller
                        control={control}
                        name="is_comments_enabled"
                        render={({ field: { onChange, value } }) => (
                          <Switch size="sm" checked={!!value} onCheckedChange={onChange} aria-label="Allow comments" />
                        )}
                      />
                    </div>
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="text-13">Allow reactions</div>
                      <Controller
                        control={control}
                        name="is_reactions_enabled"
                        render={({ field: { onChange, value } }) => (
                          <Switch size="sm" checked={!!value} onCheckedChange={onChange} aria-label="Allow reactions" />
                        )}
                      />
                    </div>
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="text-13">Allow voting</div>
                      <Controller
                        control={control}
                        name="is_votes_enabled"
                        render={({ field: { onChange, value } }) => (
                          <Switch size="sm" checked={!!value} onCheckedChange={onChange} aria-label="Allow voting" />
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </DialogBody>
          </DialogMain>

          {/* modal handlers */}
          <DialogActions>
            <DialogInfo>
              <DialogInfoIcon>
                <GlobeOutline />
              </DialogInfoIcon>
              Anyone with the link can access
            </DialogInfo>
            {!fetchSettingsLoader && (
              <div className="relative flex items-center gap-2">
                <Button variant="secondary" size="md" stretch="auto" label="Cancel" onClick={handleClose} />
                {isProjectPublished ? (
                  isDirty && (
                    <Button
                      variant="primary"
                      size="md"
                      stretch="auto"
                      type="submit"
                      label={isSubmitting ? "Updating" : "Update settings"}
                      loading={isSubmitting}
                    />
                  )
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    stretch="auto"
                    type="submit"
                    label={isSubmitting ? "Publishing" : "Publish"}
                    loading={isSubmitting}
                  />
                )}
              </div>
            )}
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
});
