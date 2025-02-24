import { MARKETING_PRICING_PAGE_LINK } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";

export const BillingRoot = () => {
  const { t } = useTranslation();
  return (
    <section className="w-full overflow-y-auto">
      <div>
        <div className="flex  items-center border-b border-custom-border-100 pb-3.5">
          <h3 className="text-xl font-medium">{t("workspace_settings.settings.billing_and_plans.title")}</h3>
        </div>
      </div>
      <div className="py-6">
        <div>
          <h4 className="text-md mb-1 leading-6">{t("workspace_settings.settings.billing_and_plans.current_plan")}</h4>
          <p className="mb-3 text-sm text-custom-text-200">
            {t("workspace_settings.settings.billing_and_plans.free_plan")}
          </p>
          <a href={MARKETING_PRICING_PAGE_LINK} target="_blank" rel="noreferrer">
            <Button variant="neutral-primary">{t("workspace_settings.settings.billing_and_plans.view_plans")}</Button>
          </a>
        </div>
      </div>
    </section>
  );
};
