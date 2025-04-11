import { ENotificationSettingsKey, EWorkspaceNotificationTransport } from "@plane/constants";

export type TNotificationSettings = {
    i18n_title: string,
    i18n_subtitle?: string,
    key: ENotificationSettingsKey
}

export type TWorkspaceUserNotification = {
    workspace: string,
    user: string,
    transport: EWorkspaceNotificationTransport,
    property_change: boolean,
    state_change: boolean,
    priority: boolean,
    assignee: boolean,
    start_due_date: boolean,
    comment: boolean,
    mention: boolean,
    comment_reactions: boolean
}