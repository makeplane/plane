import React, { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
// ui
import { EIssuePropertyType, EIssuePropertyValueError, TIssueProperty, TPropertyValueVariant } from "@plane/types";
import { Input } from "@plane/ui";
// helpers
import { cn, extractURLComponents, getValidURL } from "@plane/utils";
import { TruncatedUrl } from "./truncated-url";

type TUrlValueInputProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.URL>>;
  value: string[];
  variant: TPropertyValueVariant;
  error?: EIssuePropertyValueError;
  className?: string;
  isDisabled?: boolean;
  onTextValueChange: (value: string[]) => void;
};

export const UrlValueInput = observer((props: TUrlValueInputProps) => {
  const { propertyDetail, value, variant, error, className = "", isDisabled = false, onTextValueChange } = props;

  // states
  const [data, setData] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const validUrl = getValidURL(data?.[0]);
  const urlComponents = validUrl && extractURLComponents(validUrl);

  useEffect(() => {
    setData(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setData([newValue]);
  };

  const commonClassNames = cn(
    "w-full px-2 resize-none text-sm bg-custom-background-100 rounded border-0",
    {
      "border-[0.5px]": variant === "create",
      "border-[1px] bg-custom-background-90": variant === "update",
      "cursor-not-allowed": isDisabled,
    },
    className
  );

  const handleUrlValueChange = () => {
    const trimmedValue = data.map((val) => val.trim()).filter((val) => val);
    if (!isEqual(value, trimmedValue)) {
      onTextValueChange(trimmedValue);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        className={cn("group flex items-center justify-between gap-4 px-2 py-1.5 rounded outline-none", {
          "cursor-not-allowed": isDisabled,
          "hover:bg-custom-background-80": !isDisabled,
          "bg-custom-background-80": isEditing,
        })}
        onClick={() => !isDisabled && setIsEditing(true)}
        disabled={isDisabled}
      >
        {urlComponents ? (
          <TruncatedUrl url={urlComponents} />
        ) : data?.[0] ? (
          <span className="text-sm text-custom-text-500">{data?.[0]}</span>
        ) : (
          <span className="text-sm text-custom-text-400">Add URL</span>
        )}
        {!isEditing && (
          <div className="flex items-center gap-1 group-hover:opacity-100">
            {validUrl && (
              <Link
                href={validUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 rounded bg-custom-background-80 hover:bg-custom-background-100"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
              </Link>
            )}

            <button className="p-1 flex-shrink-0  text-custom-text-400">
              <Pencil className="h-2.5 w-2.5 flex-shrink-0" />
            </button>
          </div>
        )}
      </button>
    );
  }

  return (
    <>
      <Input
        id={`single_line_url_${propertyDetail.id}`}
        type="url"
        value={data?.[0] ?? ""}
        onChange={handleInputChange}
        className={commonClassNames}
        onClick={() => {
          document.body?.setAttribute("data-delay-outside-click", "true");
        }}
        onBlur={() => {
          handleUrlValueChange();
          document.body?.removeAttribute("data-delay-outside-click");
        }}
        placeholder="Add URL"
        hasError={Boolean(error)}
        disabled={isDisabled}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleUrlValueChange();
          }
          e.stopPropagation();
        }}
      />
      {Boolean(error) && (
        <span className="text-xs font-medium text-red-500">
          {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
        </span>
      )}
    </>
  );
});
