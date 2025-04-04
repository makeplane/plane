"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
// import sortBy from "lodash/sortBy";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { WorkspaceService } from "@/services/workspace.service";
import { API_BASE_URL } from "@/helpers/common.helper";
import { FilterHeader, FilterOption } from "@/components/issues";
import { FilterSearch } from "./search-filters";

type CustomPropertySection = {
  data: string[];
  page?: number;
  total_pages?: number;
  total_results?: number;
  searchQuery?: string;
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
  const { workspaceSlug } = useParams();
  const workspaceService = new WorkspaceService(API_BASE_URL);
  const { appliedFilters, handleUpdate, searchQuery } = props;

  const [mainPreviewEnabled, setMainPreviewEnabled] = useState(true);
  const [groupPreviewEnabled, setGroupPreviewEnabled] = useState<Record<string, boolean>>({});
  const [customProperties, setCustomProperties] = useState<CustomPropertiesState>({});

  const fetchCustomProperties = async (
    groupKey?: string,
    query?: string,
    page: number = 1
  ) => {
    try {
      const params = {
        page,
        query: query || '',
        key: groupKey || '',
      };

      const data = await workspaceService.getIssuesCustomProperties(workspaceSlug, params);

      // If no specific section, initialize all sections
      if (!groupKey) {
        const initialState: CustomPropertiesState = Object.keys(data).reduce((acc, key) => {
          acc[key] = {
            ...(data[key] || {}),
            searchQuery: ''
          };
          return acc;
        }, {});

        setCustomProperties(initialState);

        const initialGroupPreview = Object.keys(data).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        setGroupPreviewEnabled(initialGroupPreview);
      } else {
        setCustomProperties(prev => ({
          ...prev,
          [groupKey]: {
            ...(data[groupKey] || {}),
            data: page > 1
              ? [...(prev[groupKey]?.data || []), ...(data[groupKey]?.data || [])]
              : (data[groupKey]?.data || []),
            searchQuery: query || ''
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
    const nextPage = currentSection.page + 1;

    await fetchCustomProperties(
      groupKey,
      currentSection.searchQuery || '',
      nextPage
    );
  };

  const handleSectionSearch = (async (groupKey: string, query: string) => {
      await fetchCustomProperties(groupKey, query, 1);
    });
    // [fetchCustomProperties] // Dependencies
    // [setCustomProperties, fetchCustomProperties] // Dependencies
  // );

  const filteredGroupOptions = useMemo(() => {
    return Object.keys(customProperties).reduce<Record<string, any[]>>((acc, groupKey) => {
      const properties = customProperties[groupKey]?.data || [];

      const filteredValues = properties
        .filter((property) => property?.toLowerCase()?.includes(searchQuery.toLowerCase()))
      // .map((property) => property);

      if (filteredValues?.length > 0) {
        acc[groupKey] = {
          ...customProperties[groupKey],
          data: filteredValues,
        };
      }

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
        <div>
          {Object.keys(filteredGroupOptions).map((groupKey) => {
            const groupedSection = filteredGroupOptions[groupKey];
            const properties = filteredGroupOptions[groupKey].data || [];
            return (
              <div key={groupKey} className="pl-2">
                <FilterHeader
                  title={groupKey}
                  isPreviewEnabled={groupPreviewEnabled[groupKey]}
                  handleIsPreviewEnabled={() => toggleGroupPreview(groupKey)}
                />
                {groupPreviewEnabled[groupKey] && (
                  <div>
                    <FilterSearch propertyKey={groupKey} handleSectionSearch={handleSectionSearch} />
                    {properties
                      .map((property) => (
                        <FilterOption
                          key={`${groupKey}:${property}`}
                          isChecked={appliedFilters?.includes(`${groupKey}:${property}`) ? true : false}
                          onClick={() => handleUpdate(`${groupKey}:${property}`)}
                          title={property}
                        />
                      ))}
                    {groupedSection.page < groupedSection.total_pages && (
                      <button
                        onClick={() => fetchNextPage(groupKey)}
                        className="ml-8 text-xs font-medium text-custom-primary-100 cursor-pointer"
                      >
                        View More
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
});
