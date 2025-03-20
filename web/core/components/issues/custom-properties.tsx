import React, { useState, useEffect } from "react";
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
        console.log("getIssueTypeCustomProperties response is", response);
      } catch (error) {
        console.error("Error fetching custom properties:", error);
        setError("Failed to load custom properties.");
      }
    };

    getIssueTypeCustomProperties();
  }, [workspaceSlug, issue_type_id]);

  const mergedCustomProperties = issueTypeCustomProperties.map((customProp) => {
    // Find the corresponding property in customProperties
    const customProperty = customProperties?.find(
      (prop) => prop.key === customProp.name
    );

    return {
      key: customProp.name,
      value: customProperty ? customProperty.value : "", // Use existing value or set empty if not found
      issue_type_custom_property: customProp.id,
      is_required: customProp.is_required,
      id: customProperty ? customProperty.id : "",
    };
  });
  console.log("CustomProperties is", customProperties);
  console.log("mergedCustomProperties is", mergedCustomProperties);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!Array.isArray(mergedCustomProperties) || mergedCustomProperties.length === 0) {
    return null; 
  }

    // Inline editable component for each property
    const EditableProperty: React.FC<{ property: CustomProperty }> = React.memo(({ property }) => {
      const [value, setValue] = useState(property.value);
      console.log("Component re-rendering due to state change");
      const handleBlur = async () => {
        try {
          console.log("property.is_required is", property.is_required);
          if (property.is_required && value.trim() === "") {
            setEditableError("This field is required and cannot be left empty or consist of spaces.");
            return; // Stop further execution if the field is empty or consists of spaces
          }
          if (value !== property.value) {
            console.log(`Updating property: ${property.key}, new value: ${value}`);
            // Log the change
            const updatedProperty = { ...property, value };
            console.log("Property sending to update is", [updatedProperty]);
            // Call updateCustomProperties with only the updated property
            updateCustomProperties([updatedProperty]);
          }
        } catch (error) {
          // Handle errors related to updating
          console.error("Error updating custom property:", error);
          setEditableError("Failed to update custom property.");
        }
      };

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        console.log(`Editing property: ${property.key}, current value: ${e.target.value}`);
      };
  
      return (
        <div>
          {/* <label htmlFor={property.key} className="text-sm text-custom-text-300">
            {property.is_required && <span className="text-red-500">* </span>}
            {property.key}
          </label> */}
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className="text-sm border rounded px-1 py-0.5"
          />
          {error && <div className="error-message text-red-500 text-xs mt-1">{error}</div>}
        </div>
      )
    });

  return (
    <div className="w-full">
      <hr className="flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-full mx-auto my-1" />
      {editableError && <div className="error-message">{editableError}</div>}
      {mergedCustomProperties.map((element) => (
        <div key={element.key} className="flex min-h-8 gap-2 align-items-center">
          <div className="flex w-2/5 flex-shrink-0 gap-1 pt-2 text-sm text-custom-text-300">
            <span>
              {element.is_required && <span className="text-red-500">* </span>} 
              {element.key}
            </span>
          </div>
          <div className="h-full min-h-8 w-3/5 mt-1 ml-5 flex-grow">
            <EditableProperty property={element} />
          </div>
        </div>
      ))}
    </div>
  );
};
