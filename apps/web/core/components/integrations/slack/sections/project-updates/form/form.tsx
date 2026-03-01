/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState, useEffect } from "react";
import useSWR from "swr";
import type { SlackConversation, TSlackProjectUpdatesConfig } from "@plane/etl/slack";
import { E_SLACK_PROJECT_UPDATES_EVENTS } from "@plane/etl/slack";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TWorkspaceEntityConnection } from "@plane/types";
import { ModalCore, Loader } from "@plane/ui";
import { useSlackIntegration } from "@/plane-web/hooks/store";
import { SlackProjectChannelForm } from "./channel-map";

/**
 * Interface definitions
 */
export interface ProjectUpdatesFormProps {
  modal: boolean;
  handleSubmit: (
    projectId: string,
    channelId: string,
    channelName: string,
    events: E_SLACK_PROJECT_UPDATES_EVENTS[]
  ) => Promise<void>;
  projectConnection?: TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>;
  handleModal: (modal: boolean) => void;
}

export interface SlackProjectNotificationMap {
  projectId?: string;
  channelId?: string;
  channelName?: string;
  events: E_SLACK_PROJECT_UPDATES_EVENTS[];
}

/**
 * Main Form Component for Project Updates Configuration
 * Handles the modal, data loading, and form state
 */
function ProjectUpdatesForm({
  modal,
  handleModal,
  projectConnection,
  handleSubmit: handleSubmitProp,
}: ProjectUpdatesFormProps) {
  const { t } = useTranslation();
  const { appConnectionIds, getAppByConnectionId, fetchSlackChannels } = useSlackIntegration();

  // Initialize form state with the project connection data if it exists
  const [formData, setFormData] = useState<SlackProjectNotificationMap>({
    projectId: projectConnection?.project_id || undefined,
    channelId: projectConnection?.entity_id || undefined,
    channelName: projectConnection?.entity_slug || undefined,
    events: projectConnection?.config?.subscribedEvents || [E_SLACK_PROJECT_UPDATES_EVENTS.NEW_WORK_ITEM_CREATED],
  });

  // Update form data when projectConnection changes (important for edit mode)
  useEffect(() => {
    if (projectConnection) {
      setFormData({
        projectId: projectConnection.project_id || undefined,
        channelId: projectConnection.entity_id || undefined,
        channelName: projectConnection.entity_slug || undefined,
        events: projectConnection.config?.subscribedEvents || [E_SLACK_PROJECT_UPDATES_EVENTS.NEW_WORK_ITEM_CREATED],
      });
    }
  }, [projectConnection]);

  // Reset form when modal changes
  useEffect(() => {
    if (!modal) {
      // Only clear the form when closing if we're not in edit mode (projectConnection is undefined)
      if (!projectConnection) {
        setFormData({
          projectId: undefined,
          channelId: undefined,
          channelName: undefined,
          events: [E_SLACK_PROJECT_UPDATES_EVENTS.NEW_WORK_ITEM_CREATED],
        });
      }
    }
  }, [modal, projectConnection]);

  const appConnection =
    appConnectionIds && appConnectionIds.length > 0 ? getAppByConnectionId(appConnectionIds[0]) : undefined;

  // Fetch Slack channels data (useSWR must be called unconditionally)
  const {
    data: channels,
    isLoading: isChannelsLoading,
    error: channelsError,
  } = useSWR<SlackConversation[]>(
    appConnection?.connection_id ? `SLACK_CHANNELS_${appConnection.connection_id}` : null,
    appConnection?.connection_id ? async () => fetchSlackChannels(appConnection.connection_id) : null,
    {
      errorRetryCount: 0,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  if (!appConnection) {
    return null;
  }

  // Handle form field changes
  const handleFormChange = <T extends keyof SlackProjectNotificationMap>(
    key: T,
    value: SlackProjectNotificationMap[T]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.projectId || !formData.channelId || !formData.channelName) return;

    try {
      await handleSubmitProp(formData.projectId, formData.channelId, formData.channelName, formData.events);
      handleModal(false);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to save project connection",
        message: "Please try again later",
      });
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    // Reset form to initial state
    setFormData({
      projectId: projectConnection?.project_id || undefined,
      channelId: projectConnection?.entity_id || undefined,
      channelName: projectConnection?.entity_slug || undefined,
      events: projectConnection?.config?.subscribedEvents || [E_SLACK_PROJECT_UPDATES_EVENTS.NEW_WORK_ITEM_CREATED],
    });

    handleModal(false);
  };

  // Show error state if channels couldn't be loaded
  if (channelsError) {
    return (
      <ModalCore isOpen={modal} handleClose={() => handleModal(false)}>
        <div className="p-7 space-y-4">
          <div className="text-body-sm-medium">Project Updates Notifications</div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-secondary mb-2">{t("common.error")}</div>
            <div className="text-body-xs-regular text-placeholder">
              {t("slack_integration.project_updates.project_updates_form.failed_to_load_channels")}
            </div>
            <Button variant="primary" onClick={() => handleModal(false)} className="mt-4">
              Close
            </Button>
          </div>
        </div>
      </ModalCore>
    );
  }

  // Show loading skeleton while channels are being fetched
  if (isChannelsLoading) {
    return (
      <ModalCore isOpen={modal} handleClose={() => handleModal(false)}>
        <div className="space-y-5 p-7">
          <Loader>
            {/* Header */}
            <div className="space-y-1 mb-5">
              <Loader.Item height="24px" width="240px" />
              <Loader.Item height="18px" width="320px" />
            </div>

            {/* Form container */}
            <div className="border border-subtle rounded-lg p-4 space-y-4">
              {/* Project and channel dropdowns row */}
              <div className="flex items-center gap-4">
                {/* Project dropdown */}
                <div className="flex-1 space-y-2">
                  <Loader.Item height="18px" width="80px" />
                  <Loader.Item height="36px" width="100%" />
                </div>

                {/* Arrow */}
                <div>
                  <Loader.Item height="40px" width="40px" className="rounded-full" />
                </div>

                {/* Channel dropdown */}
                <div className="flex-1 space-y-2">
                  <Loader.Item height="18px" width="80px" />
                  <Loader.Item height="36px" width="100%" />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 mt-4">
              <Loader.Item height="32px" width="80px" />
              <Loader.Item height="32px" width="80px" />
            </div>
          </Loader>
        </div>
      </ModalCore>
    );
  }

  return (
    <ModalCore isOpen={modal} handleClose={handleCancel}>
      <div className="space-y-5 p-7">
        {/* Header */}
        <div className="space-y-1">
          <div className="text-body-sm-medium">{t("slack_integration.project_updates.project_updates_form.title")}</div>
          <div className="text-body-xs-regular text-secondary">
            {t("slack_integration.project_updates.project_updates_form.description")}
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-4">
          <SlackProjectChannelForm
            value={formData}
            channels={channels || []}
            handleChange={handleFormChange}
            onSave={handleSubmit}
            onCancel={handleCancel}
          />

          {/* Action Buttons */}
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="secondary" onClick={handleCancel}>
              {t("cancel")}
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!formData?.projectId || !formData?.channelId}>
              {t("save")}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
}

export default ProjectUpdatesForm;
