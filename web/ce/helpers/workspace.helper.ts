export type TRenderSettingsLink = (workspaceSlug: string, settingKey: string) => boolean;
export const shouldRenderSettingLink: TRenderSettingsLink = (workspaceSlug, settingKey) => true;
