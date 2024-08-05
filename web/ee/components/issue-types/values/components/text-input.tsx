import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// ui
import { Input, TextArea } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web types
import { TPropertyValueVariant, TTextAttributeDisplayOptions } from "@/plane-web/types";

type TTextValueInputProps = {
  propertyId: string | undefined;
  value: string[];
  variant: TPropertyValueVariant;
  display_format: TTextAttributeDisplayOptions;
  readOnlyData?: string;
  isRequired?: boolean;
  className?: string;
  onTextValueChange: (value: string[]) => void;
};

export const TextValueInput = observer((props: TTextValueInputProps) => {
  const {
    propertyId,
    value,
    variant,
    display_format = "single-line",
    readOnlyData,
    isRequired = false,
    className = "",
    onTextValueChange,
  } = props;
  // states
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    setData(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setData([newValue]);
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setData([newValue]);
  };

  const commonClassNames = cn(
    "w-full px-2 resize-none text-sm bg-custom-background-100 rounded border-0 border-custom-border-200",
    {
      "border-[0.5px]": variant === "create",
    },
    className
  );

  switch (display_format) {
    case "single-line":
      return (
        <Input
          id={`single_line_text_${propertyId}`}
          type="text"
          value={data?.[0]}
          onChange={handleInputChange}
          className={commonClassNames}
          onBlur={() => data?.[0] !== value?.[0] && onTextValueChange(data)}
          placeholder="Enter some text"
          required={isRequired}
        />
      );
    case "multi-line":
      return (
        <TextArea
          id={`multi_line_text_${propertyId}`}
          value={data?.[0]}
          onChange={handleTextAreaChange}
          className={cn(
            commonClassNames,
            "max-h-52 vertical-scrollbar scrollbar-sm",
            variant === "create" && "min-h-28"
          )}
          onBlur={() => data?.[0] !== value?.[0] && onTextValueChange(data)}
          placeholder="Describe..."
          required={isRequired}
        />
      );
    case "readonly":
      return (
        <TextArea
          id={`readonly_text_${propertyId}`}
          value={readOnlyData ?? "--"}
          className={cn(
            commonClassNames,
            "bg-custom-background-80 text-custom-text-100 border-custom-border-400 cursor-default"
          )}
          required={isRequired}
          readOnly
        />
      );
  }
});
