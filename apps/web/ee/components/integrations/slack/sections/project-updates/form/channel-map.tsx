import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { ArrowRight, Hash, Briefcase } from "lucide-react";

// Plane components
import { PlaneLogo } from "@plane/ui";
import { Logo } from "@/components/common/logo";
import { Dropdown } from "@/plane-web/components/importers/ui";

// Hooks
import { useSlackIntegration } from "@/plane-web/hooks/store";

// Types
import { SlackConversation } from "@plane/etl/slack";
import { SlackProjectNotificationMap } from "./form";

// Assets
import SlackLogo from "@/public/services/slack.png";
import { useTranslation } from "@plane/i18n";

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
export const SlackProjectChannelForm: FC<TSlackProjectChannelForm> = observer((props) => {
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

  const availableChannels = channels.filter((channel) => {
    // Check if it's a valid channel type
    const isValidChannelType = (channel.is_channel || channel.is_group) && !channel.is_im;
    if (!isValidChannelType) return false;
    // Always include the currently selected channel (for editing scenario)
    // Filter out channels that are already connected
    return channel.id === value.channelId || !connectedChannelIds.includes(channel.id);
  });

  return (
    <div className="relative space-y-4">
      {/* Main form container with visual mapping */}
      <div className="p-4 border border-custom-border-200 rounded-lg bg-custom-background-90">
        <div className="flex items-center gap-4 text-sm">
          {/* Project Selection - Left side */}
          <div className="flex-1 space-y-1 min-w-[100px]">
            <div className="flex items-center gap-1.5 ml-2">
              <PlaneLogo className="h-3 w-auto flex-shrink-0 text-custom-primary-100" />
              <div className="text-sm font-medium text-custom-text-200">
                {t("slack_integration.project_updates.project_updates_form.project_dropdown.label")}
              </div>
            </div>
            <div className="bg-custom-background-100 rounded-md p-0.5">
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
                      <Briefcase className="w-4 h-4" />
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-custom-background-80 border border-custom-border-300">
              <ArrowRight className="h-4 w-4 text-custom-text-300" />
            </div>
          </div>

          {/* Slack Channel Selection - Right side */}
          <div className="flex-1 space-y-1 min-w-[100px]">
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-3.5 h-3.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                <Image src={SlackLogo} alt="Slack" width={12} height={12} />
              </div>
              <div className="text-sm font-medium text-custom-text-200">
                {t("slack_integration.project_updates.project_updates_form.channel_dropdown.label")}
              </div>
            </div>
            <div className="bg-custom-background-100 rounded-md p-0.5">
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
      </div>

      {/* Helper message for no available options */}
      {(availableProjects.length === 0 || availableChannels.length === 0) && (
        <div className="text-sm text-custom-text-200 p-2">
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
