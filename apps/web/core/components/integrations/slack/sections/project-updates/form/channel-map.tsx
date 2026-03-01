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

import { observer } from "mobx-react";
import { ArrowRight, Hash } from "lucide-react";
// Plane components
import type { SlackConversation } from "@plane/etl/slack";
import { E_SLACK_PROJECT_UPDATES_EVENTS } from "@plane/etl/slack";
import { Checkbox } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PlaneLogo, ProjectIcon } from "@plane/propel/icons";
import SlackLogo from "@/app/assets/services/slack.png?url";
import { Dropdown } from "@/components/importers/ui";

// Hooks
import { useSlackIntegration } from "@/plane-web/hooks/store";

// Types
import type { SlackProjectNotificationMap } from "./form";

// Assets

type TSlackProjectChannelForm = {
  value: SlackProjectNotificationMap;
  channels: SlackConversation[];
  handleChange: <T extends keyof SlackProjectNotificationMap>(key: T, value: SlackProjectNotificationMap[T]) => void;
  onSave: (value: SlackProjectNotificationMap) => Promise<void>;
  onCancel: () => void;
};

/**
 * Project-to-Channel Mapping Form Component
 * Handles the selection of project and channel with visual mapping interface
 */
export const SlackProjectChannelForm = observer(function SlackProjectChannelForm(props: TSlackProjectChannelForm) {
  // Props
  const { value, channels, handleChange } = props;

  // Hooks
  const { workspace, projectIdsByWorkspaceSlug, getProjectById, getProjectConnectionsByWorkspaceId } =
    useSlackIntegration();
  const { t } = useTranslation();

  const existingConnections = getProjectConnectionsByWorkspaceId(workspace?.id || "");

  // Get already connected project IDs and channel IDs
  const connectedProjectIds: string[] = [];
  const connectedChannelIds: string[] = [];
  existingConnections?.forEach((conn) => {
    if (conn.project_id) connectedProjectIds.push(conn.project_id);
    if (conn.entity_id) connectedChannelIds.push(conn.entity_id);
  });

  // Derived values for project selection
  const workspaceSlug = workspace?.slug || undefined;
  const planeProjectIds = (workspaceSlug && projectIdsByWorkspaceSlug(workspaceSlug)) || [];

  // Filter out already connected projects, except the current one being edited
  const availableProjects = planeProjectIds
    .map((id) => (id && getProjectById(id)) || undefined)
    .filter((project) => {
      // Always include the currently selected project (for editing scenario)
      if (!project) return false;
      return project.id === value.projectId || !connectedProjectIds.includes(project.id);
    });

  const availableChannels = channels.filter(
    (channel) =>
      // Check if it's a valid channel type
      (channel.is_channel || channel.is_group) && !channel.is_im
  );

  const handleEventToggle = (event: E_SLACK_PROJECT_UPDATES_EVENTS) => {
    const currentEvents = value.events || [];
    const isSelected = currentEvents.includes(event);

    const updatedEvents = isSelected ? currentEvents.filter((e) => e !== event) : [...currentEvents, event];

    handleChange("events", updatedEvents);
  };

  const showEventOptions = !!value.projectId && !!value.channelId;

  return (
    <div className="relative space-y-4">
      {/* Main form container with visual mapping */}
      <div className="p-4 border border-subtle rounded-lg bg-layer-1">
        <div className="flex items-center gap-4 text-body-xs-regular">
          {/* Project Selection - Left side */}
          <div className="flex-1 space-y-1 min-w-[100px]">
            <div className="flex items-center gap-1.5 ml-2">
              <PlaneLogo className="h-3 w-auto flex-shrink-0 text-accent-primary" />
              <div className="text-body-xs-medium text-secondary">
                {t("slack_integration.project_updates.project_updates_form.project_dropdown.label")}
              </div>
            </div>
            <div className="bg-surface-1 rounded-md p-0.5">
              <Dropdown
                dropdownOptions={(availableProjects || [])?.map((project) => ({
                  key: project?.id || "",
                  label: project?.name || "",
                  value: project?.id || "",
                  data: project,
                }))}
                value={value?.projectId || undefined}
                placeHolder={
                  availableProjects.length > 0
                    ? t("slack_integration.project_updates.project_updates_form.project_dropdown.placeholder")
                    : t("slack_integration.project_updates.project_updates_form.project_dropdown.no_projects")
                }
                onChange={(value: string | undefined) => handleChange("projectId", value || undefined)}
                iconExtractor={(option) => (
                  <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                    {option && option?.logo_props ? (
                      <Logo logo={option?.logo_props} size={14} />
                    ) : (
                      <ProjectIcon className="w-4 h-4" />
                    )}
                  </div>
                )}
                queryExtractor={(option) => option.name}
                disabled={availableProjects.length === 0}
              />
            </div>
          </div>

          {/* Arrow connector - Center */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-layer-1 border border-subtle">
              <ArrowRight className="h-4 w-4 text-tertiary" />
            </div>
          </div>

          {/* Slack Channel Selection - Right side */}
          <div className="flex-1 space-y-1 min-w-[100px]">
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-3.5 h-3.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                <img src={SlackLogo} alt="Slack" className="w-full h-full object-cover" />
              </div>
              <div className="text-body-xs-medium text-secondary">
                {t("slack_integration.project_updates.project_updates_form.channel_dropdown.label")}
              </div>
            </div>
            <div className="bg-surface-1 rounded-md p-0.5">
              <Dropdown
                dropdownOptions={availableChannels.map((channel) => ({
                  key: channel.id || "",
                  label:
                    channel.is_channel || channel.is_group
                      ? `${(channel as any)?.name || "channel"}`
                      : "Direct Message",
                  value: channel.id || "",
                  data: channel,
                }))}
                value={value?.channelId || undefined}
                placeHolder={
                  availableChannels.length > 0
                    ? t("slack_integration.project_updates.project_updates_form.channel_dropdown.placeholder")
                    : t("slack_integration.project_updates.project_updates_form.channel_dropdown.no_channels")
                }
                onChange={(value: string | undefined) => {
                  // Find the selected channel to get its name
                  const channel = availableChannels.find((channel) => channel.id === value);
                  handleChange("channelId", value || undefined);
                  handleChange("channelName", channel?.is_channel ? (channel as any)?.name : "");
                }}
                iconExtractor={() => (
                  <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                    <Hash className="w-4 h-4" />
                  </div>
                )}
                queryExtractor={(option) => (option.is_channel || option.is_group ? (option as any)?.name : "")}
                disabled={availableChannels.length === 0}
              />
            </div>
          </div>
        </div>

        {/* Event Checkboxes with Transition */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out p-2 ${
            showEventOptions ? "max-h-48 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-4 border-t border-subtle space-y-3">
            <div className="text-body-xs-medium text-secondary mb-2">Notify when:</div>

            <div className="flex items-start gap-2">
              <Checkbox
                checked={value.events?.includes(E_SLACK_PROJECT_UPDATES_EVENTS.NEW_WORK_ITEM_CREATED) ?? true}
                onChange={() => handleEventToggle(E_SLACK_PROJECT_UPDATES_EVENTS.NEW_WORK_ITEM_CREATED)}
                className="mt-0.5"
              />
              <span className="text-body-xs-regular text-primary">When a work item is created</span>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                checked={value.events?.includes(E_SLACK_PROJECT_UPDATES_EVENTS.WORK_ITEM_STATE_CHANGED) ?? false}
                onChange={() => handleEventToggle(E_SLACK_PROJECT_UPDATES_EVENTS.WORK_ITEM_STATE_CHANGED)}
                className="mt-0.5"
              />
              <span className="text-body-xs-regular text-primary">When a work item state changes</span>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                checked={value.events?.includes(E_SLACK_PROJECT_UPDATES_EVENTS.WORK_ITEM_COMMENT_CREATED) ?? false}
                onChange={() => handleEventToggle(E_SLACK_PROJECT_UPDATES_EVENTS.WORK_ITEM_COMMENT_CREATED)}
                className="mt-0.5"
              />
              <span className="text-body-xs-regular text-primary">When a comment is created on a work item</span>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                checked={
                  value.events?.includes(E_SLACK_PROJECT_UPDATES_EVENTS.WORK_ITEM_COMPLETED_OR_CANCELLED) ?? false
                }
                onChange={() => handleEventToggle(E_SLACK_PROJECT_UPDATES_EVENTS.WORK_ITEM_COMPLETED_OR_CANCELLED)}
                className="mt-0.5"
              />
              <span className="text-body-xs-regular text-primary">When a work item is marked cancelled or done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Helper message for no available options */}
      {(availableProjects.length === 0 || availableChannels.length === 0) && (
        <div className="text-body-xs-regular text-secondary p-2">
          {availableProjects.length === 0 && (
            <p>{t("slack_integration.project_updates.project_updates_form.all_projects_connected")}</p>
          )}
          {availableChannels.length === 0 && (
            <p>{t("slack_integration.project_updates.project_updates_form.all_channels_connected")}</p>
          )}
        </div>
      )}
    </div>
  );
});
