export type TRenderSettingsLink = (workspaceSlug: string, settingKey: string) => boolean;
export const shouldRenderSettingLink: TRenderSettingsLink = () => true;