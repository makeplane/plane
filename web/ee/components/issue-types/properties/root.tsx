import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { v4 } from "uuid";
import { InfoIcon, Plus } from "lucide-react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueProperty, TCreationListModes } from "@plane/types";
import { Button, Loader, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web components
import { IssuePropertyList, IssueTypePropertiesEmptyState } from "@/plane-web/components/issue-types";
// plane web hooks
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";

type TIssuePropertiesRoot = {
  issueTypeId: string;
};

export type TIssuePropertyCreateList = Partial<TIssueProperty<EIssuePropertyType>> & {
  key: string;
};

const defaultIssueProperty: Partial<TIssueProperty<EIssuePropertyType>> = {
  id: undefined,
  display_name: "",
  property_type: undefined,
  relation_type: undefined,
  is_multi: false,
  is_active: false,
  is_required: false,
};

export const IssuePropertiesRoot = observer((props: TIssuePropertiesRoot) => {
  const { issueTypeId } = props;
  // router
  const { projectId } = useParams();
  // states
  const [issuePropertyCreateList, setIssuePropertyCreateList] = useState<TIssuePropertyCreateList[]>([]);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectIssuePropertiesLoader } = useIssueTypes();
  const issueType = useIssueType(issueTypeId);
  // derived values
  const issuePropertiesLoader = getProjectIssuePropertiesLoader(projectId?.toString());
  const properties = issueType?.properties;
  const isAnyPropertiesAvailable = (properties && properties?.length > 0) || issuePropertyCreateList.length > 0;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);

  const scrollIntoElementView = () => {
    if (lastElementRef.current) {
      lastElementRef.current.scrollIntoView({ behavior: "auto", block: "nearest", inline: "start" });
      const propertyTitleDropdownElement = lastElementRef.current.querySelector(
        "button.property-title-dropdown"
      ) as HTMLButtonElement | null;
      setTimeout(() => {
        propertyTitleDropdownElement?.focus();
        propertyTitleDropdownElement?.click();
      }, 50);
    }
  };

  // handlers
  const handleIssuePropertyCreateList = (mode: TCreationListModes, value: TIssuePropertyCreateList) => {
    switch (mode) {
      case "add":
        setIssuePropertyCreateList((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return [...prevValue, value];
        });
        break;
      case "remove":
        setIssuePropertyCreateList((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return prevValue.filter((item) => item.key !== value.key);
        });
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={cn("pt-1", {
        "bg-custom-background-100 rounded-lg h-60 flex flex-col justify-center items-center":
          issuePropertiesLoader !== "init-loader" && !isAnyPropertiesAvailable,
      })}
    >
      {issuePropertiesLoader === "init-loader" ? (
        <Loader className="w-full space-y-4 px-6 py-4">
          <Loader.Item height="25px" width="150px" />
          <Loader.Item height="35px" width="100%" />
          <Loader.Item height="35px" width="100%" />
          <Loader.Item height="35px" width="100%" />
          <Loader.Item height="35px" width="100%" />
        </Loader>
      ) : isAnyPropertiesAvailable ? (
        <>
          <div className="w-full flex gap-2 items-center px-6">
            <div className="text-base font-medium">{t("work_item_types.settings.properties.title")}</div>
            <Tooltip position="right" tooltipContent={t("work_item_types.settings.properties.tooltip")}>
              <InfoIcon className="size-3.5 text-custom-text-200 cursor-help outline-none" />
            </Tooltip>
          </div>
          <IssuePropertyList
            issueTypeId={issueTypeId}
            issuePropertyCreateList={issuePropertyCreateList}
            handleIssuePropertyCreateList={handleIssuePropertyCreateList}
            containerRef={containerRef}
            lastElementRef={lastElementRef}
          />
        </>
      ) : (
        <IssueTypePropertiesEmptyState />
      )}
      {issuePropertiesLoader !== "init-loader" && (
        <div className={cn("flex items-center py-2 px-6", !isAnyPropertiesAvailable && "justify-center")}>
          <Button
            variant="accent-primary"
            size="sm"
            className="rounded-md"
            onClick={() => {
              handleIssuePropertyCreateList("add", {
                key: v4(),
                ...defaultIssueProperty,
              });
              setTimeout(() => {
                scrollIntoElementView();
              }, 0);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("work_item_types.settings.properties.add_button")}
          </Button>
        </div>
      )}
    </div>
  );
});
