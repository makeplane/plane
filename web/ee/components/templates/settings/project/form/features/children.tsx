import { useCallback } from "react";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
// plane imports
import { TProjectTemplateForm } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { INTAKE_FEATURES_LIST, TIntakeFeatureKeys, TProjectFeatureForTemplateKeys } from "@/plane-web/constants";

type TProjectFeatureChildrenProps = {
  feature: TProjectFeatureForTemplateKeys;
};

const IntakeFeatureChildren = observer(() => {
  // form context
  const { watch, setValue } = useFormContext<TProjectTemplateForm>();
  // derived state
  const intakeSettings = watch("project.intake_settings");

  const getFeatureStatus = useCallback(
    (feature: TIntakeFeatureKeys) => {
      switch (feature) {
        case "in_app":
          return intakeSettings.is_in_app_enabled;
        case "email":
          return intakeSettings.is_email_enabled;
        case "form":
          return intakeSettings.is_form_enabled;
        default:
          return false;
      }
    },
    [intakeSettings]
  );

  const setFeatureStatus = useCallback(
    (feature: TIntakeFeatureKeys, status: boolean) => {
      switch (feature) {
        case "in_app":
          setValue("project.intake_settings.is_in_app_enabled", status);
          break;
        case "email":
          setValue("project.intake_settings.is_email_enabled", status);
          break;
        case "form":
          setValue("project.intake_settings.is_form_enabled", status);
          break;
      }
    },
    [setValue]
  );

  return (
    <>
      {Object.entries(INTAKE_FEATURES_LIST).map(([featureKey, feature]) => {
        const intakeSettingsKey = featureKey as TIntakeFeatureKeys;
        const isFeatureEnabled = getFeatureStatus(intakeSettingsKey);
        return (
          <div key={featureKey} className="gap-x-8 gap-y-3 bg-custom-background-100 py-3">
            <div key={featureKey} className={cn("flex justify-between gap-2")}>
              <div className="flex gap-2 w-full">
                <div className="flex justify-center rounded mt-1">{feature.icon}</div>
                <div className="w-full">
                  <div className={cn("flex items-center justify-between gap-2")}>
                    <div className="flex-1 w-full">
                      <div className="text-sm font-medium leading-5 align-top ">{feature.title}</div>
                      <p className="text-sm text-custom-text-300 text-wrap mt-1">{feature.description} </p>
                    </div>
                    <ToggleSwitch
                      value={isFeatureEnabled}
                      onChange={() => setFeatureStatus(intakeSettingsKey, !isFeatureEnabled)}
                      disabled={!feature.isEnabled}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
});

export const ProjectFeatureChildren = observer((props: TProjectFeatureChildrenProps) => {
  const { feature } = props;

  const getFeatureChildren = useCallback(() => {
    switch (feature) {
      case "inbox":
        return <IntakeFeatureChildren />;
      default:
        return null;
    }
  }, [feature]);

  const FeatureChildren = getFeatureChildren();

  if (!FeatureChildren) return null;

  return <div className="pl-10 pt-4">{FeatureChildren}</div>;
});
