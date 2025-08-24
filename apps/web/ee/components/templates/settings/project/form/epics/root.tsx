import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TProjectTemplateForm } from "@plane/types";
import { ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { EpicPropertiesRoot } from "@/plane-web/components/epics/settings/epics-properties";
import { TemplateCollapsibleWrapper } from "@/plane-web/components/templates/settings/common";

export const ProjectEpicWorkItemType = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // form context
  const { control, watch } = useFormContext<TProjectTemplateForm>();
  // derived values
  const projectEpic = watch("project.epics");

  if (!projectEpic || !projectEpic.id) return null;
  return (
    <>
      <TemplateCollapsibleWrapper
        title={t("epics.label")}
        actionElement={
          <div className="flex items-center">
            <Controller
              control={control}
              name="project.is_epic_enabled"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch value={Boolean(value)} onChange={() => onChange(!value)} size="sm" />
              )}
            />
          </div>
        }
        showBorder={false}
      >
        <EpicPropertiesRoot
          epicId={projectEpic.id}
          propertiesLoader={"loaded"}
          containerClassName="border-none"
          getWorkItemTypeById={() => projectEpic}
          getClassName={() =>
            cn("bg-custom-background-100 hover:bg-custom-background-100 border border-custom-border-100 rounded-lg")
          }
        />
      </TemplateCollapsibleWrapper>
    </>
  );
});
