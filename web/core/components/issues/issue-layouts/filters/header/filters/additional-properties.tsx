"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FilterHeader, FilterOption } from "@/components/issues";
import { WorkspaceService } from "@/services/workspace.service";
import { API_BASE_URL } from "@/helpers/common.helper";
import { FilterSearch } from "./search-filters";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  additionalPropertyTitle: string | undefined;
  additionalPropertyKey: string | undefined;
  searchQuery: string;
};

export const FilterAdditionalProperties: React.FC<Props> = observer((props) => {
  const { workspaceSlug } = useParams();
  const { appliedFilters, handleUpdate, searchQuery, additionalPropertyTitle, additionalPropertyKey } = props;
  const workspaceService = new WorkspaceService(API_BASE_URL);

  const [options, setOptions] = useState({});
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const fetchOptions = async (query = '', page = 1) => {
    try {
      const response = await workspaceService.getIssueAdditionalProperties(workspaceSlug.toString(), additionalPropertyKey, query, page);
      setOptions((options) => ({
        ...response,
        query,
        data: page > 1 ? [...(options?.data || []), ...(response?.data || [])] : (response?.data || []),
      }));

    } catch (error) {
      console.error(`Error fetching ${additionalPropertyKey} options:`, error);
    }
  };

  const fetchNextPage = async () => {
    const nextPage = options.page + 1;
    await fetchOptions(
      options.query,
      nextPage
    );
  };

  const handleSectionSearch = async (_groupKey: string, query: string) => {
    await fetchOptions(query);
  };

  const filteredOptions = searchQuery
    ? (options?.data || []).filter((option: any) => option?.toLowerCase().includes(searchQuery.toLowerCase()))
    : (options?.data || []);

  return (
    <>
      <FilterHeader
        title={`${additionalPropertyTitle} ${appliedFilters?.length ? `(${appliedFilters.length})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          <FilterSearch propertyKey={additionalPropertyKey} handleSectionSearch={handleSectionSearch} />
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.map((option, index) => (
                <FilterOption
                  key={index}
                  isChecked={appliedFilters?.includes(option) ?? false}
                  onClick={() => handleUpdate(option)}
                  title={option}
                />
              ))}
              {options.page < options.total_pages && (
                <button
                  onClick={() => fetchNextPage()}
                  className="ml-8 text-xs font-medium text-custom-primary-100 cursor-pointer"
                >
                  View More
                </button>
              )}
            </>
          ) : (
            <p className="text-xs italic text-custom-text-400">No Matches Found</p>
          )}
        </div>
      )}
    </>
  );
});