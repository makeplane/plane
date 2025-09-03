import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TProjectTemplateForm } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
// plane web imports
import { TemplateCollapsibleWrapper } from "@/plane-web/components/templates/settings/common";
import { PROJECT_FEATURES_LIST_FOR_TEMPLATE, TProjectFeatureForTemplateKeys } from "@/plane-web/constants";
// local imports
import { ProjectFeatureChildren } from "./children";

export const ProjectFeatures = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // form context
  const { control, watch } = useFormContext<TProjectTemplateForm>();

  return (
    <TemplateCollapsibleWrapper title={t("common.features")}>
      <div className="flex flex-col gap-y-4 pt-2 pb-4">
        {Object.entries(PROJECT_FEATURES_LIST_FOR_TEMPLATE).map(([featureKey, feature]) => (
          <div
            key={featureKey}
            className="gap-x-8 gap-y-2 border border-custom-border-100 bg-custom-background-100 px-4 py-3 rounded-lg"
          >
            <div key={featureKey} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center bg-custom-background-80/70 p-2 rounded-lg">
                  {feature.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium leading-5">{t(feature.key)}</h4>
                  </div>
                  <p className="text-xs leading-4 text-custom-text-300">{t(`${feature.key}_description`)}</p>
                </div>
              </div>
              <Controller
                control={control}
                name={`project.${feature.property}` as keyof TProjectTemplateForm}
                render={({ field: { value, onChange } }) => (
                  <ToggleSwitch value={Boolean(value)} onChange={() => onChange(!value)} size="sm" />
                )}
              />
            </div>
            {watch(`project.${feature.property}` as keyof TProjectTemplateForm) && (
              <ProjectFeatureChildren feature={featureKey as TProjectFeatureForTemplateKeys} />
            )}
          </div>
        ))}
      </div>
    </TemplateCollapsibleWrapper>
  );
});
