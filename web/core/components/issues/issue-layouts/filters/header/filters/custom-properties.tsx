"use client";

import React, { useMemo, useState } from "react";
// import sortBy from "lodash/sortBy";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { IState } from "@plane/types";
import { WorkspaceService } from "@/services/workspace.service";
import { API_BASE_URL } from "@/helpers/common.helper";
// import { Loader, StateGroupIcon } from "@plane/ui";
import { FilterHeader, FilterOption } from "@/components/issues";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
  states: IState[] | undefined;
};

export const FilterCustomProperty: React.FC<Props> = observer((props) => {
  const { workspaceSlug } = useParams();
  const workspaceService = new WorkspaceService(API_BASE_URL);
  const { appliedFilters, handleUpdate, searchQuery } = props;

  const [mainPreviewEnabled, setMainPreviewEnabled] = useState(true);
  const [groupPreviewEnabled, setGroupPreviewEnabled] = useState<Record<string, boolean>>({});
  const [renderMoreGroupItems, setRenderMoreGroupItems] = useState<Record<string, boolean>>({});
  const [groupedProperties, setGroupedProperties] = useState<Record<string, any[]>>({});

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const handleViewToggle = (groupKey) => {
    setRenderMoreGroupItems((prev) => {
      return {
        ...prev,
        [groupKey]: !prev[groupKey]
      };
    });
  };

  React.useEffect(() => {
    const fetchCustomProperties = async (): Promise<void> => {
      try {
        const data = await workspaceService.getIssuesCustomProperties(workspaceSlug);
        setGroupedProperties(data);
        Object?.keys(data)?.forEach((groupKey) => {
          setGroupPreviewEnabled((prev) => ({
            ...prev,
            [groupKey]: true
          }));
        });
      } catch (error) {
        console.error("Error fetching custom properties:", error);
      }
    };

    fetchCustomProperties();
  }, [workspaceSlug]);

  const filteredGroupOptions = useMemo(() => {
    return Object.keys(groupedProperties).reduce((acc, groupKey) => {
      const properties = groupedProperties[groupKey];

      const filteredValues = properties
        .filter((property) => property?.toLowerCase()?.includes(searchQuery.toLowerCase()))
        .map((property) => property);

      if (filteredValues?.length > 0) {
        acc[groupKey] = filteredValues;
      }

      return acc;
    }, {});
  }, [searchQuery, groupedProperties]);

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
            const properties = filteredGroupOptions[groupKey];
            return (
              <div key={groupKey} className="pl-2">
                <FilterHeader
                  title={groupKey}
                  isPreviewEnabled={groupPreviewEnabled[groupKey]}
                  handleIsPreviewEnabled={() => toggleGroupPreview(groupKey)}
                />
                {groupPreviewEnabled[groupKey] && (
                  <div>
                    {properties
                      .slice(0, renderMoreGroupItems[groupKey] ? properties.length : 5)
                      .map((property) => (
                        <FilterOption
                          key={`${groupKey}:${property}`}
                          isChecked={appliedFilters?.includes(`${groupKey}:${property}`)}
                          onClick={() => handleUpdate(`${groupKey}:${property}`)}
                          title={property}
                        />
                      ))}
                    {properties.length > 5 ? <button
                      type="button"
                      className="ml-8 text-xs font-medium text-custom-primary-100"
                      onClick={() => handleViewToggle(groupKey)}
                    >
                      {renderMoreGroupItems[groupKey] ? "View less" : "View all"}
                    </button> : null}
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
