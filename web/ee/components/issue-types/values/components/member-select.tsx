import React, { useEffect, useState } from "react";
import { isEqual } from "lodash";
import { observer } from "mobx-react";
// components
import { MemberDropdown } from "@/components/dropdowns";
import { MemberDropdownProps } from "@/components/dropdowns/member/types";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web types
import { TPropertyValueVariant } from "@/plane-web/types";

type TMemberValueSelectProps = {
  value: string[];
  projectId: string;
  variant: TPropertyValueVariant;
  isMultiSelect?: boolean;
  isRequired?: boolean; // TODO: remove if not required.
  isDisabled?: boolean;
  onMemberValueChange: (value: string[]) => Promise<void>;
};

export const MemberValueSelect = observer((props: TMemberValueSelectProps) => {
  const { value, projectId, variant, isMultiSelect = false, isDisabled = false, onMemberValueChange } = props;
  // states
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    setData(value);
  }, [value]);

  const memberPickerProps: Partial<MemberDropdownProps> = {
    buttonClassName: cn("py-1 text-sm justify-between", {
      "text-custom-text-400": !data?.length,
      "border-custom-border-200": variant === "create",
    }),
    buttonContainerClassName: cn("w-full text-left", {
      "bg-custom-background-90": isDisabled,
    }),
    dropdownArrowClassName: "h-3.5 w-3.5 hidden group-hover:inline",
    placeholder: isMultiSelect ? "Select members" : "Select member",
    disabled: isDisabled,
    hideIcon: !data?.length,
    placement: "bottom-start",
    dropdownArrow: true,
    showUserDetails: true,
    onClose: () => {
      if (!isEqual(data, value)) {
        onMemberValueChange(data);
      }
    },
  };

  return (
    <>
      {isMultiSelect ? (
        <MemberDropdown
          {...memberPickerProps}
          projectId={projectId}
          value={data || []}
          onChange={(memberIds) => setData(memberIds)}
          buttonVariant={
            variant === "update"
              ? data.length > 1
                ? "transparent-without-text"
                : "transparent-with-text"
              : "border-with-text"
          }
          className="w-full flex-grow group"
          multiple
        />
      ) : (
        <MemberDropdown
          {...memberPickerProps}
          projectId={projectId}
          value={data?.[0] || null}
          onChange={(memberId) => setData(memberId && !data?.includes(memberId) ? [memberId] : [])}
          buttonVariant={
            variant === "update"
              ? data.length > 1
                ? "transparent-without-text"
                : "transparent-with-text"
              : "border-with-text"
          }
          className="w-full flex-grow group"
          multiple={false}
        />
      )}
    </>
  );
});
