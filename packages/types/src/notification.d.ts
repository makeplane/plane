import { ENotificationSettingsKey, EWorkspaceNotificationTransport } from "@plane/constants";

export type TNotificationSettings = {
    i18n_title: string,
    key: ENotificationSettingsKey
}

export type TWorkspaceUserNotification = {
    workspace: string,
    user: string,
    transport: EWorkspaceNotificationTransport,
    work_item_property_updates_enabled: boolean,
    status_updates_enabled: boolean,
    priority_updates_enabled: boolean,
    assignee_updates_enabled: boolean,
    start_due_date_updates_enabled: boolean,
    module_updates_enabled: boolean,
    cycle_updates_enabled: boolean,
    mentioned_comments_updates_enabled: boolean,
    new_comments_updates_enabled: boolean,
    reaction_comments_updates_enabled: boolean
}