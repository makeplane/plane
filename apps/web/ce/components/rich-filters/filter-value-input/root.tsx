import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TFilterValue, TFilterProperty } from "@plane/types";
// local imports
import type { TFilterValueInputProps } from "@/components/rich-filters/shared";

export const AdditionalFilterValueInput = observer(function AdditionalFilterValueInput<
  P extends TFilterProperty,
  V extends TFilterValue,
>(_props: TFilterValueInputProps<P, V>) {
  return (
    // Fallback
    <div className="h-full flex items-center px-4 text-11 text-placeholder transition-opacity duration-200 cursor-not-allowed">
      Filter type not supported
    </div>
  );
});
