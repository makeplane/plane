import { store } from "@/lib/store-context";

export const shouldRenderSettingLink = (settingKey: string) => {
  const isSelfManaged = store.workspaceSubscription.currentWorkspaceSubscribedPlanDetail?.is_self_managed;
  const isSelfHostedLicenseActivated = store.selfHostedSubscription.licenseActivationByWorkspaceSlug();
  switch (settingKey) {
    case "activation":
      return !isSelfManaged || isSelfHostedLicenseActivated ? false : true;
    default:
      return true;
  }
};
