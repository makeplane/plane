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

import React, { useState, createContext, useContext, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { v4 } from "uuid";
// plane imports
import type { TCreationListModes, TIssuePropertyOptionCreateUpdateData, TIssuePropertyOption } from "@plane/types";

// default values
const defaultPropertyOption: Partial<TIssuePropertyOption> = {
  id: undefined,
  name: undefined,
  is_default: false,
};

export type TCustomPropertyOptionsContext = {
  propertyOptions: TIssuePropertyOptionCreateUpdateData[];
  setPropertyOptions: React.Dispatch<React.SetStateAction<TIssuePropertyOptionCreateUpdateData[]>>;
  handlePropertyOptionsList: (mode: TCreationListModes, value: TIssuePropertyOptionCreateUpdateData) => void;
  resetOptions: () => void;
};

const CustomPropertyOptionsContext = createContext<TCustomPropertyOptionsContext | undefined>(undefined);

export const useCustomPropertyOptions = (): TCustomPropertyOptionsContext => {
  const context = useContext(CustomPropertyOptionsContext);
  if (context === undefined)
    throw new Error("useCustomPropertyOptions must be used within CustomPropertyOptionsProvider");
  return context;
};

type TCustomPropertyOptionsProviderProps = {
  customPropertyId: string | undefined;
  getSortedActivePropertyOptions: (propertyId: string) => TIssuePropertyOptionCreateUpdateData[] | undefined;
  children: React.ReactNode;
};

export const CustomPropertyOptionsProvider = observer(function CustomPropertyOptionsProvider(
  props: TCustomPropertyOptionsProviderProps
) {
  const { customPropertyId, getSortedActivePropertyOptions, children } = props;
  // states
  const [options, setOptions] = useState<TIssuePropertyOptionCreateUpdateData[]>(
    customPropertyId ? (getSortedActivePropertyOptions(customPropertyId) ?? []) : []
  );
  const [sortedOptions, setSortedOptions] = useState<TIssuePropertyOptionCreateUpdateData[]>([]);

  // handlers
  const handlePropertyOptionsList = useCallback(
    (mode: TCreationListModes, value: TIssuePropertyOptionCreateUpdateData) => {
      switch (mode) {
        case "add":
          setOptions((prevValue) => [...(prevValue ?? []), value]);
          break;
        case "update":
          setOptions((prevValue) => {
            const prev = prevValue ? [...prevValue] : [];
            if (value.id) {
              const index = prev.findIndex((item) => item.id === value.id);
              if (index !== -1) prev[index] = { ...prev[index], ...value };
            } else if (value.key) {
              const index = prev.findIndex((item) => item.key === value.key);
              if (index !== -1) prev[index] = { ...prev[index], ...value };
            }
            return [...prev];
          });
          break;
        case "remove":
          setOptions((prevValue) => (prevValue ?? []).filter((item) => item.key !== value.key));
          break;
        default:
          break;
      }
    },
    []
  );

  const resetOptions = useCallback(() => {
    setOptions(customPropertyId ? (getSortedActivePropertyOptions(customPropertyId) ?? []) : []);
  }, [customPropertyId, getSortedActivePropertyOptions]);

  useEffect(() => {
    const updatedSortedOptions = options.sort((a, b) => {
      if (a.sort_order && b.sort_order) return a.sort_order - b.sort_order;
      return 0;
    });
    setSortedOptions(updatedSortedOptions);
  }, [options]);

  // Auto-add empty option slots
  useEffect(() => {
    const emptyOptions = options.filter((item) => !item.id && item.key && !item.name).length;
    if (emptyOptions < 2) {
      const optionsToAdd = 2 - emptyOptions;
      const newOptions = Array.from({ length: optionsToAdd }, () => ({
        key: v4(),
        ...defaultPropertyOption,
      }));
      newOptions.forEach((option) => handlePropertyOptionsList("add", option));
    }
  }, [handlePropertyOptionsList, options]);

  return (
    <CustomPropertyOptionsContext.Provider
      value={{
        propertyOptions: sortedOptions,
        setPropertyOptions: setOptions,
        handlePropertyOptionsList,
        resetOptions,
      }}
    >
      {children}
    </CustomPropertyOptionsContext.Provider>
  );
});
