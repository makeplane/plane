import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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
  layout?: "quarter" | "two-fifths"; // Accept layout prop
};

export const CustomProperties: React.FC<CustomPropertiesProps> = ({
  customProperties,
  issue_type_id,
  workspaceSlug,
  updateCustomProperties,
  layout = "quarter", // Default to "quarter" if no layout prop is passed
}) => {
  const [issueTypeCustomProperties, setissueTypeCustomProperties] = useState<CustomProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editableError, setEditableError] = useState<string | null>(null);
  const [editingPropertyKey, setEditingPropertyKey] = useState<string | null>(null);
  const [localCustomProperties, setLocalCustomProperties] = useState<CustomProperty[]>([]);

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

  useEffect(() => {
    if (customProperties) {
      setLocalCustomProperties(customProperties);
    }
  }, [customProperties]);

  const mergedCustomProperties = issueTypeCustomProperties.map((customProp) => {
    const customProperty = localCustomProperties?.find(
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

  const handlePropertyUpdate = async (updatedProperty: CustomProperty) => {
    try {
      setLocalCustomProperties(prev => {
        const updatedProperties = [...(prev || [])];
        const existingIndex = updatedProperties.findIndex(p => p.key === updatedProperty.key);
        
        if (existingIndex >= 0) {
          updatedProperties[existingIndex] = {...updatedProperties[existingIndex], ...updatedProperty};
        } else {
          updatedProperties.push(updatedProperty);
        }
        
        return updatedProperties;
      });
      
      await updateCustomProperties([updatedProperty]);
      
      setEditableError(null);
    } catch (error) {
      setEditableError("Failed to update custom property.");
    }
  };

  const EditableProperty: React.FC<{ property: CustomProperty }> = React.memo(({ property }) => {
    const [value, setValue] = useState(property.value);

    const handleBlur = async () => {
      if (property.is_required && value.trim() === "") {
        setEditableError("This field is required and cannot be left empty or consist of spaces.");
        return;
      }
      
      if (value !== property.value) {
        const updatedProperty = { ...property, value };
        await handlePropertyUpdate(updatedProperty);
      }
      
      setEditingPropertyKey(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      // Clear error when user starts typing
      if (editableError && e.target.value.trim() !== "") {
        setEditableError(null);
      }
    };

    return (
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        autoFocus
        placeholder={`Add ${property.key}`}
        className="text-sm w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-custom-primary-100"
      />
    );
  });

  // Determine the layout widths based on the layout prop
  const labelWidth = layout === "two-fifths" ? "w-2/5" : "w-1/4";
  const valueWidth = layout === "two-fifths" ? "w-3/5" : "w-3/4";

  return (
    <div className="w-full">
      <hr className="flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-full mx-auto my-1" />
      {editableError && (
        <div className="error-message text-red-500 text-sm my-1">{editableError}</div>
      )}

      <div className="space-y-2">
        {mergedCustomProperties.map((element) => (
          <div key={element.key} className="flex w-full items-center gap-3 min-h-8">
            {/* Label area */}
            <div className={`flex items-center gap-1 ${labelWidth} flex-shrink-0 text-sm text-custom-text-300 truncate`}>
              <span>
                {element.key}
                {element.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
            {/* Value area */}
            <div className={`${valueWidth} flex-grow group text-sm`}>
              {editingPropertyKey === element.key ? (
                <EditableProperty property={element} />
              ) : (
                <button
                  type="button"
                  className="group flex items-center justify-between gap-2 px-2 py-0.5 rounded outline-none w-full hover:bg-custom-background-80"
                  onClick={() => setEditingPropertyKey(element.key)}
                >
                  {element.value ? (
                    <span className="text-sm text-custom-text-500 whitespace-nowrap overflow-hidden text-ellipsis"
                    title={element.value}
                  >
                    {element.value}</span>
                  ) : (
                    <span className="text-sm text-custom-text-400">Add {element.key}</span>
                  )}
                  <span className="p-1 flex-shrink-0 opacity-0 group-hover:opacity-100 text-custom-text-400">
                    <Pencil className="h-2.5 w-2.5 flex-shrink-0" />
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};