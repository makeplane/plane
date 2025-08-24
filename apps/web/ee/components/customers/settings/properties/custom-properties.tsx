import React, { FC, useRef, useState, useMemo } from "react";
import { observer } from "mobx-react";
import { v4 } from "uuid";
import { ChevronRight, Plus } from "lucide-react";
// plane constants
// plane i18n
import { CUSTOMER_PROPERTY_TRACKER_ELEMENTS, CUSTOMER_PROPERTY_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// plane types
import { EIssuePropertyType, TCreationListModes, TIssueProperty, TIssuePropertyPayload } from "@plane/types";
// plane ui
import { Button, Collapsible } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// plane web components
import { CustomerPropertiesEmptyState } from "@/plane-web/components/customers/settings/properties";
import { IssuePropertyList } from "@/plane-web/components/issue-types/properties/property-list";
import type { TCustomPropertyOperations } from "@/plane-web/components/issue-types/properties/property-list-item";
import { useCustomerProperties } from "@/plane-web/hooks/store/customers/use-customer-properties";

export type TCustomerPropertyCreateList = Partial<TIssueProperty<EIssuePropertyType>> & {
  key: string;
};

export const defaultCustomProperty: Partial<TIssueProperty<EIssuePropertyType>> = {
  id: undefined,
  display_name: "",
  property_type: undefined,
  relation_type: undefined,
  is_multi: false,
  is_active: false,
  is_required: false,
};

export const CustomerCustomPropertiesRoot: FC = observer(() => {
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [customerPropertyCreateList, setCustomerPropertyCreateList] = useState<TCustomerPropertyCreateList[]>([]);
  // hooks
  const { t } = useTranslation();
  const { properties, getPropertyById, createProperty, deleteProperty } = useCustomerProperties();
  // derived
  const isAnyPropertiesAvailable = customerPropertyCreateList.length > 0 || properties.length > 0;

  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);

  // handlers
  const handleCustomerPropertiesCreate = (mode: TCreationListModes, value: TCustomerPropertyCreateList) => {
    switch (mode) {
      case "add":
        setCustomerPropertyCreateList((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return [...prevValue, value];
        });
        break;
      case "remove":
        if (value) {
          setCustomerPropertyCreateList((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return prevValue.filter((item) => item.key !== value.key);
          });
        }
        break;
      default:
        break;
    }
  };

  // property operations
  const customPropertyOperations: TCustomPropertyOperations = useMemo(
    () => ({
      getPropertyDetail: (propertyId: string) => getPropertyById(propertyId)?.asJSON,
      getSortedActivePropertyOptions: (propertyId: string) => {
        const propertyDetail = getPropertyById(propertyId);
        if (!propertyDetail) return;
        return propertyDetail.sortedActivePropertyOptions;
      },
      createProperty: async (data: TIssuePropertyPayload) => createProperty(data),
      updateProperty: async (propertyId: string, data: TIssuePropertyPayload) => {
        const updatedProperty = getPropertyById(propertyId)?.updateProperty;
        if (!updatedProperty) return;
        updatedProperty(propertyId, data);
      },
      deleteProperty: async (propertyId: string) => deleteProperty(propertyId),
      removePropertyListItem: (value: TCustomerPropertyCreateList) => {
        handleCustomerPropertiesCreate("remove", value);
      },
    }),
    [createProperty, deleteProperty, getPropertyById]
  );

  return (
    <div className="group/issue-type bg-custom-background-90/60 rounded-md">
      <Collapsible
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        title={
          <div className="flex w-full gap-2 cursor-pointer items-center px-4">
            <div className="flex-shrink-0">
              <ChevronRight
                className={cn("flex-shrink-0 size-4 transition-all text-custom-text-300", {
                  "rotate-90": isOpen,
                })}
              />
            </div>
            <div className="text-left">
              <h3 className="text-base font-medium">{t("customers.properties.custom.title")}</h3>
              <p className="text-sm text-custom-text-300">{t("customers.properties.custom.info")}</p>
            </div>
          </div>
        }
        buttonClassName={cn("flex w-full py-3 gap-2 items-center justify-between")}
      >
        <div className="pb-4">
          {isAnyPropertiesAvailable ? (
            <>
              <IssuePropertyList
                issuePropertyCreateList={customerPropertyCreateList}
                customPropertyOperations={customPropertyOperations}
                containerRef={containerRef}
                lastElementRef={lastElementRef}
                properties={properties}
                isUpdateAllowed={false}
                trackers={{
                  create: {
                    button: CUSTOMER_PROPERTY_TRACKER_ELEMENTS.CREATE_PROPERTY_BUTTON,
                    eventName: CUSTOMER_PROPERTY_TRACKER_EVENTS.CREATE,
                  },
                  update: {
                    eventName: CUSTOMER_PROPERTY_TRACKER_EVENTS.UPDATE,
                  },
                  delete: {
                    eventName: CUSTOMER_PROPERTY_TRACKER_EVENTS.DELETE,
                  },
                }}
              />
              <div className={cn("flex items-center py-2 px-4", !isAnyPropertiesAvailable && "justify-center")}>
                <Button
                  variant="accent-primary"
                  size="sm"
                  className="rounded-md"
                  onClick={() => {
                    handleCustomerPropertiesCreate("add", {
                      key: v4(),
                      ...defaultCustomProperty,
                    });
                  }}
                  data-ph-element={CUSTOMER_PROPERTY_TRACKER_ELEMENTS.CREATE_PROPERTY_BUTTON}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("customers.properties.add.primary_button")}
                </Button>
              </div>
            </>
          ) : (
            <CustomerPropertiesEmptyState handleCustomerPropertiesCreate={handleCustomerPropertiesCreate} />
          )}
        </div>
      </Collapsible>
    </div>
  );
});
