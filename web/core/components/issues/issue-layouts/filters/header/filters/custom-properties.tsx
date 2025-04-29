"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { WorkspaceService } from "@/services/workspace.service";
import { API_BASE_URL } from "@/helpers/common.helper";
import { FilterHeader, FilterOption, FilterDate, FilterNumber } from "@/components/issues";
import { FilterSearch } from "./search-filters";
import { useTranslation } from "@plane/i18n";

type CustomPropertySection = {
  data: string[];
  page?: number;
  total_pages?: number;
  total_results?: number;
  query?: string;
  data_type?: string | null;
};

type CustomPropertiesState = {
  [key: string]: CustomPropertySection;
};

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterCustomProperty: React.FC<Props> = observer((props) => {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const workspaceService = new WorkspaceService(API_BASE_URL);
  const { appliedFilters, handleUpdate, searchQuery } = props;

  const [mainPreviewEnabled, setMainPreviewEnabled] = useState(true);
  const [groupPreviewEnabled, setGroupPreviewEnabled] = useState<Record<string, boolean>>({});
  const [customProperties, setCustomProperties] = useState<CustomPropertiesState>({});

  const fetchCustomProperties = async (
    groupKey?: string,
    query?: string,
    page?: number
  ) => {
    try {
      const params = {
        page: page || 1,
        query: query || '',
        key: groupKey || '',
      };
      const data = await workspaceService.getIssuesCustomProperties(workspaceSlug?.toString(), params) as any;

      // If no specific section, initialize all sections
      if (!groupKey) {
        const initialState = Object.keys(data).reduce((acc, key) => {
          const section = data[key] || {};
          acc[key] = {
            ...section,
            query: '',
            data_type: section.data_type ?? "text",
          };
          return acc;
        }, {} as CustomPropertiesState);

        setCustomProperties(initialState);

        const initialGroupPreview = Object.keys(data).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setGroupPreviewEnabled(initialGroupPreview);
      } else {
        setCustomProperties(prev => ({
          ...prev,
          [groupKey]: {
            ...(data[groupKey] || {}),
            data: (page ?? 0) > 1
              ? [...(prev[groupKey]?.data || []), ...(data[groupKey]?.data || [])]
              : (data[groupKey]?.data || []),
            query: query || '',
            data_type: data[groupKey]?.data_type ?? "text",
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching custom properties:", error);
    }
  };

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  useEffect(() => {
    fetchCustomProperties();
  }, [workspaceSlug]);

  const fetchNextPage = async (groupKey: string) => {
    const currentSection = customProperties[groupKey];
    const nextPage = (currentSection.page ?? 1) + 1;
    await fetchCustomProperties(
      groupKey,
      currentSection.query || '',
      nextPage
    );
  };

  const handleSectionSearch = (async (groupKey: string, query: string) => {
    await fetchCustomProperties(groupKey, query, 1);
  });

  const filteredGroupOptions = useMemo(() => {
    return Object.keys(customProperties).reduce<Record<string, CustomPropertySection>>((acc, groupKey) => {
      const properties: string[] = customProperties[groupKey]?.data || [];

      const filteredValues = properties
        .filter((property: string) => property?.toLowerCase()?.includes(searchQuery.toLowerCase()))

      acc[groupKey] = {
        ...customProperties[groupKey],
        data: filteredValues,
      };

      return acc;
    }, {});
  }, [searchQuery, customProperties]);

  const toggleGroupPreview = (groupKey: string) => {
    setGroupPreviewEnabled((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  return (
    <>
      <FilterHeader
        title={`Custom Properties${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={mainPreviewEnabled}
        handleIsPreviewEnabled={() => setMainPreviewEnabled(!mainPreviewEnabled)}
      />
      {mainPreviewEnabled && (
        <>
          {Object.keys(filteredGroupOptions).map((groupKey) => {
            const groupedSection = filteredGroupOptions[groupKey];
            const properties = filteredGroupOptions[groupKey].data || [];
            if (groupedSection.data_type === "date") {
              return (
                <div key={groupKey}>
                  <FilterDate
                    groupKey={groupKey}
                    onFilter={handleUpdate}
                    title={groupKey}
                    isPreviewEnabled={groupPreviewEnabled[groupKey]}
                    handleIsPreviewEnabled={() => toggleGroupPreview(groupKey)}
                  />
                </div>
              );
            }
            
            // For number type
            if (groupedSection.data_type === "number") {
              return (
                <div key={groupKey}>
                  <FilterNumber
                    groupKey={groupKey}
                    onFilter={handleUpdate}
                    title={groupKey}
                    isPreviewEnabled={groupPreviewEnabled[groupKey]}
                    handleIsPreviewEnabled={() => toggleGroupPreview(groupKey)}
                  />
                </div>
              );
            }
            
            // For text and boolean types
            return (
              <div key={groupKey}>
                <FilterHeader
                  title={groupKey}
                  isPreviewEnabled={groupPreviewEnabled[groupKey]}
                  handleIsPreviewEnabled={() => toggleGroupPreview(groupKey)}
                />
                {groupPreviewEnabled[groupKey] && (
                  <div>
                    <FilterSearch
                      propertyKey={groupKey}
                      handleSectionSearch={handleSectionSearch}
                    />
                    <>
                      {properties.map(property => (
                        <FilterOption
                          key={`${groupKey}:${property}`}
                          isChecked={appliedFilters?.includes(`${groupKey}:${property}`) ? true : false}
                          onClick={() => handleUpdate(`${groupKey}:${property}`)}
                          title={property}
                        />
                      ))}
                      {(groupedSection.page ?? 1) < (groupedSection.total_pages ?? 1) && properties.length ? (
                        <button
                          onClick={() => fetchNextPage(groupKey)}
                          className="ml-8 text-xs font-medium text-custom-primary-100 cursor-pointer"
                        >
                          {t("view_more")}
                        </button>
                      ) : null}
                      {
                        properties.length == 0 ?
                        <p className="text-xs italic text-custom-text-400">{t("no_matches_found")}</p> : null
                      }
                    </>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
});
