"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FilterHeader, FilterOption } from "@/components/issues";
import { WorkspaceService } from "@/services/workspace.service";
import { API_BASE_URL } from "@/helpers/common.helper";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  additionalPropertyTitle: string | undefined;
  additionalPropertyKey: string | undefined;
  searchQuery: string;
};

export const FilterAdditionalProperties: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = useParams();
  const { appliedFilters, handleUpdate, searchQuery, additionalPropertyTitle, additionalPropertyKey } = props;
  const workspaceService = new WorkspaceService(API_BASE_URL);
  
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [visibleOptions, setVisibleOptions] = useState(5); 

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await workspaceService.getIssueAdditionalProperties(workspaceSlug.toString(), projectId.toString(), props.additionalPropertyKey);
        const formattedOptions = response.data.map((item: string) => ({ label: item, value: item })) || [];
        setOptions(formattedOptions);
      } catch (error) {
        console.error(`Error fetching ${additionalPropertyKey} options:`, error);
      }
    };

    fetchOptions();
  }, [workspaceSlug, projectId, additionalPropertyKey]);

  const filteredOptions = searchQuery
    ? options.filter((option: any) => option?.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  return (
    <>
      <FilterHeader
        title={`${additionalPropertyTitle} ${appliedFilters?.length ? `(${appliedFilters.length})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.slice(0, visibleOptions).map(({ label, value }) => (
                <FilterOption
                  key={value}
                  isChecked={appliedFilters?.includes(value) ?? false}
                  onClick={() => handleUpdate(value)}
                  title={label}
                />
              ))}
              {filteredOptions.length > 5 && (
                <button
                  className="text-blue-500 text-xs mt-2"
                  onClick={() => setVisibleOptions(visibleOptions === 5 ? filteredOptions.length : 5)}
                >
                  {visibleOptions === 5 ? "View More" : "View Less"}
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