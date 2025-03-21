import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { Tooltip } from "@plane/ui";
import axios from "axios";

export type CustomProperty = {
  key: string;
  value: string;
  issue_type_custom_property: string;
  is_required: boolean;
};

type CustomPropertiesProps = {
  customProperties?: CustomProperty[]; 
  issue_type_id: string;
  workspaceSlug: string;
  updateCustomProperties: (updatedProperties: CustomProperty[]) => void;
};

export const CustomProperties: React.FC<CustomPropertiesProps> = ({ customProperties, issue_type_id, workspaceSlug, updateCustomProperties }) => {
  const [issueTypeCustomProperties, setissueTypeCustomProperties] = useState<CustomProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editableError, setEditableError] = useState<string | null>(null);
  const [hoveredPropertyKey, setHoveredPropertyKey] = useState<string | null>(null);
  useEffect(() => {
    const getIssueTypeCustomProperties = async () => {
      try {
        const response = await axios.get(
          `/api/v1/workspaces/${workspaceSlug}/issue-type/${issue_type_id}/custom-properties/`,
          {
            headers: {
              'x-api-key': 'TEST_API_TOKEN',
            }
          }
        );
        setissueTypeCustomProperties(response.data);
      } catch (error) {
        setError("Failed to load custom properties.");
      }
    };

    getIssueTypeCustomProperties();
  }, [workspaceSlug, issue_type_id]);

  const mergedCustomProperties = issueTypeCustomProperties.map((customProp) => {
    const customProperty = customProperties?.find(
      (prop) => prop.key === customProp.name
    );

    return {
      key: customProp.name,
      value: customProperty ? customProperty.value : "",
      issue_type_custom_property: customProp.id,
      is_required: customProp.is_required,
      id: customProperty ? customProperty.id : "",
    };
  });

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!Array.isArray(mergedCustomProperties) || mergedCustomProperties.length === 0) {
    return null; 
  }

    const EditableProperty: React.FC<{ property: CustomProperty }> = React.memo(({ property }) => {
      const [value, setValue] = useState(property.value);
      const handleBlur = async () => {
        try {
          if (property.is_required && value.trim() === "") {
            setEditableError("This field is required and cannot be left empty or consist of spaces.");
            return;
          }
          if (value !== property.value) {
            const updatedProperty = { ...property, value };
            updateCustomProperties([updatedProperty]);
          }
        } catch (error) {
          setEditableError("Failed to update custom property.");
        }
      };

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
      };
  
      return (
        <div>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className="text-sm border rounded px-1 py-0.5"
          />
          {editableError && <div className="error-message text-red-500 text-xs mt-1">{editableError}</div>}
        </div>
      )
    });

    return (
      <div className="w-full">
        <hr className="flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-full mx-auto my-1" />
        {editableError && <div className="error-message">{editableError}</div>}
        {mergedCustomProperties.map((element) => (
          <div
            key={element.key}
            className="flex min-h-8 gap-2 align-items-center"
            onMouseEnter={() => setHoveredPropertyKey(element.key)}
            onMouseLeave={() => setHoveredPropertyKey(null)}
          >
            <div className="flex w-2/5 flex-shrink-0 gap-1 pt-2 text-sm text-custom-text-300">
              <span>
                {element.is_required && <span className="text-red-500">* </span>}
                {element.value ? (
                  <span className="text-sm text-custom-text-500">{element.value}</span>
                ) : (
                  <span className="text-sm text-custom-text-400">Add {element.key}</span>
                )}
              </span>
            </div>
            <div className="h-full min-h-8 w-3/5 mt-1 ml-5 flex-grow">
              {hoveredPropertyKey === element.key && (
                <Tooltip tooltipContent="Edit" position="bottom">
                  <div className="flex items-center gap-1">
                    <Pencil className="h-2.5 w-2.5 flex-shrink-0 cursor-pointer" />
                  </div>
                </Tooltip>
              )}
              {hoveredPropertyKey === element.key && (
                <EditableProperty property={element} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
