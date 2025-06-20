import { FC } from "react";
import { useTranslation } from "@plane/i18n";
type TEstimateTextInputProps = {
  value?: string;
  handleEstimateInputValue: (value: string) => void;
};

export const EstimateTextInput: FC<TEstimateTextInputProps> = (props) => {
  const { value, handleEstimateInputValue } = props;

  // i18n
  const { t } = useTranslation();

  return (
    <input
      value={value}
      onChange={(e) => handleEstimateInputValue(e.target.value)}
      className="border-none focus:ring-0 focus:border-0 focus:outline-none px-3 py-2 w-full bg-transparent text-sm"
      placeholder={t("project_settings.estimates.create.enter_estimate_point")}
      autoFocus
      type="text"
    />
  );
};
