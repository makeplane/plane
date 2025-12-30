import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { ISSUE_LAYOUT_MAP } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CheckIcon } from "@plane/propel/icons";
import { EIssueLayoutTypes } from "@plane/types";
import { Dropdown } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { IssueLayoutIcon } from "@/components/issues/issue-layouts/layout-icon";
import { getIconButtonStyling } from "@plane/propel/icon-button";

type TLayoutDropDown = {
  onChange: (value: EIssueLayoutTypes) => void;
  value: EIssueLayoutTypes;
  disabledLayouts?: EIssueLayoutTypes[];
};

export const LayoutDropDown = observer(function LayoutDropDown(props: TLayoutDropDown) {
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
      <div className="flex gap-2 items-center text-secondary">
        <IssueLayoutIcon layout={dropdownValue.key} strokeWidth={2} className={`size-3.5 text-secondary`} />
        <span className="font-medium text-11">{t(dropdownValue.i18n_label)}</span>
      </div>
    );
  }, []);

  const itemContent = useCallback((props: { value: string; selected: boolean }) => {
    const dropdownValue = ISSUE_LAYOUT_MAP[props.value as EIssueLayoutTypes];

    return (
      <div className={cn("flex gap-2 items-center text-secondary w-full justify-between")}>
        <div className="flex gap-2 items-center">
          <IssueLayoutIcon layout={dropdownValue.key} strokeWidth={2} className={`size-3 text-secondary`} />
          <span className="font-medium text-11">{t(dropdownValue.i18n_label)}</span>
        </div>
        {props.selected && <CheckIcon className="h-3.5 w-3.5 flex-shrink-0" />}
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
      buttonContainerClassName={cn(getIconButtonStyling("secondary", "lg"), "w-auto px-2")}
      buttonContent={buttonContent}
      renderItem={itemContent}
      disableSearch
    />
  );
});
