import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueProperty } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { cn } from "@plane/utils";

type TPropertyTitleDescriptionInputProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType>>;
  error?: string;
  onPropertyDetailChange: <K extends keyof TIssueProperty<EIssuePropertyType>>(
    key: K,
    value: TIssueProperty<EIssuePropertyType>[K],
    shouldSync?: boolean
  ) => void;
};

export const PropertyTitleDescriptionInput = observer((props: TPropertyTitleDescriptionInputProps) => {
  const { propertyDetail, error, onPropertyDetailChange } = props;
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col">
      <Input
        id="display_name"
        type="text"
        mode={Boolean(error) ? "primary" : "true-transparent"}
        placeholder={t("work_item_types.settings.properties.create_update.form.display_name.placeholder")}
        value={propertyDetail.display_name}
        onChange={(e) => onPropertyDetailChange("display_name", e.target.value)}
        className={cn("w-full resize-none text-lg font-medium bg-custom-background-100 rounded")}
        tabIndex={1}
        hasError={Boolean(error)}
        inputSize="xs"
        required
        autoFocus
      />
      {Boolean(error) && <span className="text-xs text-red-500">{error}</span>}
      <TextArea
        id="description"
        mode="true-transparent"
        placeholder={t("work_item_types.settings.properties.create_update.form.description.placeholder")}
        value={propertyDetail.description}
        onChange={(e) => onPropertyDetailChange("description", e.target.value)}
        className={cn(
          "w-full sm:min-h-20 max-h-48 overflow-auto horizontal-scrollbar scrollbar-xs resize-none text-sm bg-custom-background-100"
        )}
        textAreaSize="xs"
        tabIndex={2}
      />
    </div>
  );
});
