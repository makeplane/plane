import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane constants
import { ISSUE_LAYOUT_MAP } from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
// plane ui
import { Dropdown } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";
// types
import { EIssueLayoutTypes } from "@plane/types";
// components
import { IssueLayoutIcon } from "@/components/issues";

type TLayoutDropDown = {
  onChange: (value: EIssueLayoutTypes) => void;
  value: EIssueLayoutTypes;
  disabledLayouts?: EIssueLayoutTypes[];
};

export const LayoutDropDown = observer((props: TLayoutDropDown) => {
  const { onChange, value = EIssueLayoutTypes.LIST, disabledLayouts = [] } = props;
  // plane i18n
  const { t } = useTranslation();
  // derived values
  const availableLayouts = useMemo(
    () => Object.values(ISSUE_LAYOUT_MAP).filter((layout) => !disabledLayouts.includes(layout.key)),
    [disabledLayouts]
  );

  const options = useMemo(
    () =>
      availableLayouts.map((issueLayout) => ({
        data: issueLayout.key,
        value: issueLayout.key,
      })),
    [availableLayouts]
  );

  const buttonContent = useCallback((isOpen: boolean, buttonValue: string | string[] | undefined) => {
    const dropdownValue = ISSUE_LAYOUT_MAP[buttonValue as EIssueLayoutTypes];
    return (
      <div className="flex gap-2 items-center text-custom-text-200">
        <IssueLayoutIcon layout={dropdownValue.key} strokeWidth={2} className={`size-3.5 text-custom-text-200`} />
        <span className="font-medium text-xs">{t(dropdownValue.i18n_label)}</span>
      </div>
    );
  }, []);

  const itemContent = useCallback((props: { value: string; selected: boolean }) => {
    const dropdownValue = ISSUE_LAYOUT_MAP[props.value as EIssueLayoutTypes];

    return (
      <div className={cn("flex gap-2 items-center text-custom-text-200 w-full justify-between")}>
        <div className="flex gap-2 items-center">
          <IssueLayoutIcon layout={dropdownValue.key} strokeWidth={2} className={`size-3 text-custom-text-200`} />
          <span className="font-medium text-xs">{t(dropdownValue.i18n_label)}</span>
        </div>
        {props.selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
      </div>
    );
  }, []);

  const keyExtractor = useCallback((option: any) => option.value, []);

  return (
    <Dropdown
      onChange={onChange as (value: string) => void}
      value={value?.toString()}
      keyExtractor={keyExtractor}
      options={options}
      buttonContainerClassName="bg-custom-background-100 border border-custom-border-200 hover:bg-custom-background-90 focus:text-custom-text-300 focus:bg-custom-background-90 px-2 py-1.5  rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center relative"
      buttonContent={buttonContent}
      renderItem={itemContent}
      disableSearch
    />
  );
});
