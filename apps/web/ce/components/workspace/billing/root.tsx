import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum } from "@plane/types";
import { getSubscriptionTextColor } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { SettingsHeading } from "@/components/settings/heading";

export const BillingRoot = observer(() => {
  const { t } = useTranslation();

  return (
    <section className="relative size-full flex flex-col overflow-y-auto scrollbar-hide">
      <SettingsHeading
        title={t("workspace_settings.settings.billing_and_plans.heading")}
        description="Enterprise Edition with all features enabled"
      />
      <div className={cn("transition-all duration-500 ease-in-out will-change-[height,opacity]")}>
        <div className="py-6">
          <div className={cn("px-6 py-4 border border-custom-border-200 rounded-lg")}>
            <div className="flex gap-2 font-medium items-center justify-between">
              <div className="flex flex-col gap-1">
                <h4
                  className={cn("text-xl leading-6 font-bold", getSubscriptionTextColor(EProductSubscriptionEnum.ENTERPRISE))}
                >
                  Enterprise Edition
                </h4>
                <div className="text-sm text-custom-text-200 font-medium">
                  All features enabled: Unlimited projects, issues, cycles, modules, pages, storage, SAML/OIDC, LDAP, custom reports, project templates, advanced integrations, and more
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
