import { useCallback, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { v4 } from "uuid";
import { InfoIcon, Plus } from "lucide-react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TIssueProperty, TCreationListModes, TIssuePropertyPayload, IIssueType, TLoader } from "@plane/types";
import { Button, Loader, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web components
import { IssuePropertyList, IssueTypePropertiesEmptyState } from "@/plane-web/components/issue-types";

type TIssuePropertiesRoot = {
  issueTypeId: string;
  propertiesLoader: TLoader;
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
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
  const { issueTypeId, propertiesLoader, getWorkItemTypeById } = props;
  // states
  const [issuePropertyCreateList, setIssuePropertyCreateList] = useState<TIssuePropertyCreateList[]>([]);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const issueType = getWorkItemTypeById(issueTypeId);
  // derived values
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
  const handleIssuePropertyCreateList = useCallback((mode: TCreationListModes, value: TIssuePropertyCreateList) => {
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
  }, []);

  const customPropertyOperations = useMemo(
    () => ({
      // helper method to get the property detail
      getPropertyDetail: (propertyId: string) => issueType?.getPropertyById(propertyId)?.asJSON,
      // helper method to get the sorted active property options
      getSortedActivePropertyOptions: (propertyId: string) => {
        const propertyDetail = issueType?.getPropertyById(propertyId);
        if (!propertyDetail) return;
        return propertyDetail.sortedActivePropertyOptions;
      },
      // helper method to create a property
      createProperty: async (data: TIssuePropertyPayload) => issueType?.createProperty?.(data),
      // helper method to update a property
      updateProperty: async (propertyId: string, data: TIssuePropertyPayload) => {
        const updatedProperty = issueType?.getPropertyById(propertyId)?.updateProperty;
        if (!updatedProperty) return;
        updatedProperty(issueTypeId, data);
      },
      // helper method to delete a property
      deleteProperty: async (propertyId: string) => issueType?.deleteProperty?.(propertyId),
      // helper method to remove a property from the create list
      removePropertyListItem: (value: TIssuePropertyCreateList) => {
        handleIssuePropertyCreateList("remove", value);
      },
    }),
    [issueType, issueTypeId, handleIssuePropertyCreateList]
  );

  return (
    <div
      className={cn("pt-1", {
        "bg-custom-background-100 rounded-lg h-60 flex flex-col justify-center items-center":
          propertiesLoader !== "init-loader" && !isAnyPropertiesAvailable,
      })}
    >
      {propertiesLoader === "init-loader" ? (
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
            properties={properties}
            issuePropertyCreateList={issuePropertyCreateList}
            customPropertyOperations={customPropertyOperations}
            containerRef={containerRef}
            lastElementRef={lastElementRef}
            isUpdateAllowed={issueType?.issue_exists === false}
          />
        </>
      ) : (
        <IssueTypePropertiesEmptyState />
      )}
      {propertiesLoader !== "init-loader" && (
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
