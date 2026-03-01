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

import { useCallback, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { v4 } from "uuid";
import { InfoIcon, PlusIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import type {
  EIssuePropertyType,
  IIssueType,
  TCreationListModes,
  TIssueProperty,
  TIssuePropertyPayload,
  TLoader,
} from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { IssueTypePropertiesEmptyState } from "./empty-state";
import { IssuePropertyList } from "./property-list";

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

export const IssuePropertiesRoot = observer(function IssuePropertiesRoot(props: TIssuePropertiesRoot) {
  const { issueTypeId, propertiesLoader, getWorkItemTypeById } = props;
  // states
  const [issuePropertyCreateList, setIssuePropertyCreateList] = useState<TIssuePropertyCreateList[]>([]);
  // plane hooks
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  // store hooks
  const issueType = getWorkItemTypeById(issueTypeId);
  // derived values
  const properties = issueType?.sortedProperties;
  const isAnyPropertiesAvailable = (properties && properties?.length > 0) || issuePropertyCreateList.length > 0;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);

  const scrollIntoElementView = () => {
    if (lastElementRef.current) {
      lastElementRef.current.scrollIntoView({ behavior: "auto", block: "nearest", inline: "start" });
      const propertyTitleDropdownElement = lastElementRef.current.querySelector<HTMLButtonElement>(
        "button.property-title-dropdown"
      );
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
      createProperty: async (data: TIssuePropertyPayload) => {
        const response = await issueType?.createProperty?.(data);
        return response;
      },
      // helper method to update a property
      updateProperty: async (propertyId: string, data: TIssuePropertyPayload) => {
        const updatedProperty = issueType?.getPropertyById(propertyId)?.updateProperty;
        if (!updatedProperty) return;
        await updatedProperty(issueTypeId, data);
      },
      // helper method to delete a property
      deleteProperty: async (propertyId: string) => {
        await issueType?.deleteProperty?.(propertyId);
      },
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
        "bg-surface-1 rounded-lg h-60 flex flex-col justify-center items-center":
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
            <div className="text-body-sm-medium">{t("work_item_types.settings.properties.title")}</div>
            <Tooltip position="right" tooltipContent={t("work_item_types.settings.properties.tooltip")}>
              <span>
                <InfoIcon className="size-3.5 text-secondary cursor-help outline-none" />
              </span>
            </Tooltip>
          </div>
          <IssuePropertyList
            properties={properties}
            issuePropertyCreateList={issuePropertyCreateList}
            customPropertyOperations={customPropertyOperations}
            containerRef={containerRef}
            lastElementRef={lastElementRef}
            isUpdateAllowed={!issueType?.id}
          />
        </>
      ) : (
        <IssueTypePropertiesEmptyState />
      )}
      {propertiesLoader !== "init-loader" && (
        <div className={cn("flex items-center py-2 px-6", !isAnyPropertiesAvailable && "justify-center")}>
          <Button
            variant="secondary"
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
            <PlusIcon className="h-3.5 w-3.5" />
            {t("work_item_types.settings.properties.add_button")}
          </Button>
        </div>
      )}
    </div>
  );
});
