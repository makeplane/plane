import { observer } from "mobx-react";
// ui
import { Input, TextArea } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web types
import { EIssuePropertyType, TIssueProperty } from "@/plane-web/types";

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

  return (
    <div className="w-full flex flex-col">
      <Input
        id="display_name"
        type="text"
        mode={Boolean(error) ? "primary" : "true-transparent"}
        placeholder="Title"
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
        placeholder="Description..."
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
