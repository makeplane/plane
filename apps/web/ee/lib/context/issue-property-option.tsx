import React, { useState, createContext, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { v4 } from "uuid";
// plane imports
import { TCreationListModes, TIssuePropertyOption, TIssuePropertyOptionCreateUpdateData } from "@plane/types";
// local imports
import type { TCustomPropertyOperations } from "@/plane-web/components/issue-types/properties/property-list-item";
// default values
const defaultIssuePropertyOption: Partial<Partial<TIssuePropertyOption>> = {
  id: undefined,
  name: undefined,
  is_default: false,
};

export type TIssuePropertyOptionsContext = {
  propertyOptions: TIssuePropertyOptionCreateUpdateData[];
  setPropertyOptions: React.Dispatch<React.SetStateAction<TIssuePropertyOptionCreateUpdateData[]>>;
  handlePropertyOptionsList: (mode: TCreationListModes, value: TIssuePropertyOptionCreateUpdateData) => void;
  resetOptions: () => void;
};

export const IssuePropertyOptionContext = createContext<TIssuePropertyOptionsContext | undefined>(undefined);

type TIssuePropertyOptionsProviderProps = {
  customPropertyId: string | undefined;
  customPropertyOperations: TCustomPropertyOperations;
  children: React.ReactNode;
};

export const IssuePropertyOptionsProvider = observer((props: TIssuePropertyOptionsProviderProps) => {
  const { customPropertyId, customPropertyOperations, children } = props;
  const { getSortedActivePropertyOptions } = customPropertyOperations;
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
          setOptions((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return [...prevValue, value];
          });
          break;
        case "update":
          setOptions((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            if (value.id) {
              const index = prevValue.findIndex((item) => item.id === value.id);
              if (index !== -1) prevValue[index] = { ...prevValue[index], ...value };
            } else if (value.key) {
              const index = prevValue.findIndex((item) => item.key === value.key);
              if (index !== -1) prevValue[index] = { ...prevValue[index], ...value };
            }
            return [...prevValue];
          });
          break;
        case "remove":
          setOptions((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return prevValue.filter((item) => item.key !== value.key);
          });
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

  useEffect(() => {
    const emptyOptions = options.filter((item) => !item.id && item.key && !item.name).length;
    if (emptyOptions < 2) {
      const optionsToAdd = 2 - emptyOptions;
      const newOptions = Array.from({ length: optionsToAdd }, () => ({
        key: v4(),
        ...defaultIssuePropertyOption,
      }));
      newOptions.forEach((option) => handlePropertyOptionsList("add", option));
    }
  }, [handlePropertyOptionsList, options]);

  return (
    <IssuePropertyOptionContext.Provider
      value={{
        propertyOptions: sortedOptions,
        setPropertyOptions: setOptions,
        handlePropertyOptionsList,
        resetOptions,
      }}
    >
      {children}
    </IssuePropertyOptionContext.Provider>
  );
});
