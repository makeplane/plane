/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useRef, useState, useMemo } from "react";
import { observer } from "mobx-react";
import { v4 } from "uuid";
// plane imports
import { PlusIcon, ChevronRightIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { EIssuePropertyType, TCreationListModes, TIssueProperty, TIssuePropertyPayload } from "@plane/types";
// plane ui
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// helpers
import { cn } from "@plane/utils";
// plane web components
import { CustomerPropertiesEmptyState } from "@/components/customers/settings/properties";
import { IssuePropertyList } from "@/components/work-item-types/properties/property-list";
import type { TCustomPropertyOperations } from "@/components/work-item-types/properties/property-list-item";
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

export const CustomerCustomPropertiesRoot = observer(function CustomerCustomPropertiesRoot() {
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [customerPropertyCreateList, setCustomerPropertyCreateList] = useState<TCustomerPropertyCreateList[]>([]);
  // hooks
  const { t } = useTranslation();
  const { sortedProperties, getPropertyById, createProperty, deleteProperty } = useCustomerProperties();
  // derived
  const isAnyPropertiesAvailable = customerPropertyCreateList.length > 0 || sortedProperties.length > 0;

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
    <div className="group/issue-type bg-layer-1 rounded-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className={cn("flex w-full py-3 gap-2 items-center justify-between")}>
          <div className="flex w-full gap-2 cursor-pointer items-center px-4">
            <div className="flex-shrink-0">
              <ChevronRightIcon
                className={cn("flex-shrink-0 size-4 transition-all text-tertiary", {
                  "rotate-90": isOpen,
                })}
              />
            </div>
            <div className="text-left">
              <h3 className="text-14 font-medium">{t("customers.properties.custom.title")}</h3>
              <p className="text-13 text-tertiary">{t("customers.properties.custom.info")}</p>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pb-4">
            {isAnyPropertiesAvailable ? (
              <>
                <IssuePropertyList
                  issuePropertyCreateList={customerPropertyCreateList}
                  customPropertyOperations={customPropertyOperations}
                  containerRef={containerRef}
                  lastElementRef={lastElementRef}
                  properties={sortedProperties}
                  isUpdateAllowed={true}
                />
                <div className={cn("flex items-center py-2 px-4", !isAnyPropertiesAvailable && "justify-center")}>
                  <Button
                    variant="secondary"
                    className="rounded-md"
                    onClick={() => {
                      handleCustomerPropertiesCreate("add", {
                        key: v4(),
                        ...defaultCustomProperty,
                      });
                    }}
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    {t("customers.properties.add.primary_button")}
                  </Button>
                </div>
              </>
            ) : (
              <CustomerPropertiesEmptyState handleCustomerPropertiesCreate={handleCustomerPropertiesCreate} />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
