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
import { useTranslation } from "@plane/i18n";
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { GlobeIcon, NewTabIcon, CheckIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TProjectPublishLayouts, TProjectPublishSettings } from "@plane/types";
// ui
import { Loader, ToggleSwitch, CustomSelect, ModalCore, EModalWidth } from "@plane/ui";
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

const VIEW_OPTIONS: {
  key: TProjectPublishLayouts;
  i18nLabel: string;
}[] = [
  { key: "list", i18nLabel: "issue.layouts.list" },
  { key: "kanban", i18nLabel: "issue.layouts.kanban" },
];

export const PublishProjectModal = observer(function PublishProjectModal(props: Props) {
  const { isOpen, onClose, projectId } = props;
  // i18n
  const { t } = useTranslation();
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
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("project_publish.toasts.settings_updated"),
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
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("project_publish.toasts.unpublish_error"),
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
        title: t("toast.error"),
        message: t("project_publish.toasts.no_layout_selected"),
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

  const SPACE_APP_URL = (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
  const publishLink = `${SPACE_APP_URL}/issues/${projectPublishSettings?.anchor}`;

  const handleCopyLink = () =>
    copyTextToClipboard(publishLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("project_publish.toasts.link_copied"),
      })
    );

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="flex items-center justify-between gap-2 p-5">
          <h5 className="text-18 font-medium text-secondary">{t("publish_project")}</h5>
          {isProjectPublished && (
            <Button
              variant="error-fill"
              size="lg"
              onClick={() => handleUnPublishProject(watch("id") ?? "")}
              loading={isUnPublishing}
            >
              {isUnPublishing ? t("project_publish.unpublishing") : t("project_publish.unpublish")}
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
            {isProjectPublished && projectPublishSettings && (
              <>
                <div className="border border-strong rounded-md py-1.5 pl-4 pr-1 flex items-center justify-between gap-2">
                  <a
                    href={publishLink}
                    className="text-13 text-secondary truncate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {publishLink}
                  </a>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <a
                      href={publishLink}
                      className="size-8 grid place-items-center bg-layer-3 hover:bg-layer-3-hover rounded-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <NewTabIcon className="size-4" />
                    </a>
                    <button
                      type="button"
                      className="h-8 bg-layer-3 hover:bg-layer-3-hover rounded-sm text-11 font-medium py-2 px-3"
                      onClick={handleCopyLink}
                    >
                      {t("copy_link")}
                    </button>
                  </div>
                </div>
                <p className="text-13 font-medium text-accent-primary flex items-center gap-1 mt-3">
                  <span className="relative grid place-items-center size-2.5">
                    <span className="animate-ping absolute inline-flex size-full rounded-full bg-accent-primary opacity-75" />
                    <span className="relative inline-flex rounded-full size-1.5 bg-accent-primary" />
                  </span>
                  {t("project_publish.live_status")}
                </p>
              </>
            )}
            <div className="space-y-4">
              <div className="relative flex items-center justify-between gap-2">
                <div className="text-13">{t("project_publish.views")}</div>
                <Controller
                  control={control}
                  name="view_props"
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      value={value}
                      label={VIEW_OPTIONS.filter((o) => selectedLayouts.includes(o.key))
                        .map((o) => t(o.i18nLabel))
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
                          {t(option.i18nLabel)}
                          {selectedLayouts.includes(option.key) && <CheckIcon className="size-3.5 flex-shrink-0" />}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              </div>
              <div className="relative flex items-center justify-between gap-2">
                <div className="text-13">{t("project_publish.allow_comments")}</div>
                <Controller
                  control={control}
                  name="is_comments_enabled"
                  render={({ field: { onChange, value } }) => (
                    <ToggleSwitch value={!!value} onChange={onChange} size="sm" />
                  )}
                />
              </div>
              <div className="relative flex items-center justify-between gap-2">
                <div className="text-13">{t("project_publish.allow_reactions")}</div>
                <Controller
                  control={control}
                  name="is_reactions_enabled"
                  render={({ field: { onChange, value } }) => (
                    <ToggleSwitch value={!!value} onChange={onChange} size="sm" />
                  )}
                />
              </div>
              <div className="relative flex items-center justify-between gap-2">
                <div className="text-13">{t("project_publish.allow_voting")}</div>
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
        <div className="relative flex items-center justify-between border-t border-subtle px-5 py-4 mt-4">
          <div className="flex items-center gap-1 text-13 text-placeholder">
            <GlobeIcon className="size-3.5" />
            <div className="text-13">{t("project_publish.link_access")}</div>
          </div>
          {!fetchSettingsLoader && (
            <div className="relative flex items-center gap-2">
              <Button variant="secondary" size="lg" onClick={handleClose}>
                {t("cancel")}
              </Button>
              {isProjectPublished ? (
                isDirty && (
                  <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
                    {isSubmitting ? t("updating") : t("project_publish.update_settings")}
                  </Button>
                )
              ) : (
                <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
                  {isSubmitting ? t("project_publish.publishing") : t("publish")}
                </Button>
              )}
            </div>
          )}
        </div>
      </form>
    </ModalCore>
  );
});
