import React, { useState, useEffect } from "react";
import { Pencil, ChevronDown, Loader2 } from "lucide-react";
import axios from "axios";
import { Input } from "@plane/ui";
import { Combobox } from "@headlessui/react";
import { usePopper } from "react-popper";
import { useOutsideClickDetector } from "@plane/helpers";
import { cn } from "@/helpers/common.helper";

export type CustomProperty = {
  key: string;
  value: string;
  issue_type_custom_property: string;
  is_required: boolean;
  name: string;
  id: string;
  data_type: string;
  is_active: boolean;
};

type CustomPropertiesProps = {
  customProperties?: CustomProperty[];
  issue_type_id: string;
  workspaceSlug: string;
  updateCustomProperties: (updatedProperties: CustomProperty[]) => void;
  issueId: string;
  layout?: "quarter" | "two-fifths";
};

export const CustomProperties: React.FC<CustomPropertiesProps> = ({
  customProperties,
  issue_type_id,
  workspaceSlug,
  updateCustomProperties,
  issueId,
  layout = "quarter",
}) => {
  const [issueTypeCustomProperties, setissueTypeCustomProperties] = useState<CustomProperty[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  const mergedCustomProperties = issueTypeCustomProperties
    .filter((customProp) => customProp.is_active)
    .map((customProp) => {
      const customProperty = localCustomProperties?.find((prop) => prop.key === customProp.name);

      return {
        key: customProp.name,
        value: customProperty ? customProperty.value : "",
        issue_type_custom_property: customProp.id,
        is_required: customProp.is_required,
        id: customProperty ? customProperty.id : "",
        name: customProp.name,
        data_type: customProp.data_type,
        is_active: customProp.is_active,
      };
    });

  if (error) {
    return <div className="text-red-500 text-sm mt-1">{error}</div>;
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
    } catch (error) {
      console.error("Failed to update custom property:", error);
    }
  };

  const CustomPropertyDropdown: React.FC<{ property: CustomProperty; onUpdate: (property: CustomProperty) => Promise<void>; onClose: () => void }> = React.memo(({ property, onUpdate, onClose }) => {
    const [value, setValue] = useState(property.value);
    
    // Sync value when property changes
    useEffect(() => {
      setValue(property.value);
    }, [property.value]);
    const [localError, setLocalError] = useState<string | null>(null);
    const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    
    const dropdownRef = React.useRef<HTMLDivElement | null>(null);
    const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
    
    const { styles, attributes } = usePopper(referenceElement, popperElement, {
      placement: "bottom-start",
      modifiers: [
        {
          name: "preventOverflow",
          options: {
            padding: 12,
          },
        },
      ],
    });

    const fetchDropdownOptions = async () => {
      if (isLoading || options.length > 0) return;
      
      setIsLoading(true);
      try {
        const response = await axios.get(
          `/api/workspaces/${workspaceSlug}/issues/${issueId}/custom-properties/${property.issue_type_custom_property}/dropdown-options/`
        );
        
        // WB API returns an array of strings either directly or within an object key
        // Examples: ["item1", "item2"] or { "invoice_numbers": ["item1", "item2"] }
        const responseData = response.data;
        let fetchedOptions: Array<{ value: string; label: string }> = [];
        
        if (Array.isArray(responseData)) {
          // Direct array of strings
          fetchedOptions = responseData.map((item: string) => ({
            value: item,
            label: item,
          }));
        } else if (responseData && typeof responseData === 'object') {
          // Handle objects with keys containing arrays of strings (e.g., { "invoice_numbers": [...] } or { "dropdownSourceField": [...] })
          const arrayKey = Object.keys(responseData).find(
            (key) => Array.isArray(responseData[key])
          );
          if (arrayKey) {
            const optionsArray = responseData[arrayKey] as string[];
            fetchedOptions = optionsArray.map((item: string) => ({
              value: item,
              label: item,
            }));
          }
        }
        
        setOptions(fetchedOptions);
      } catch (error) {
        setLocalError("Failed to load dropdown options.");
        console.error("Failed to fetch dropdown options:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleOpen = () => {
      setIsOpen(true);
      fetchDropdownOptions();
    };

    const handleClose = () => {
      setIsOpen(false);
      setQuery("");
    };

    useOutsideClickDetector(dropdownRef, handleClose);

    const handleChange = async (selectedValue: string) => {
      if (selectedValue === value) {
        handleClose();
        return;
      }
      setValue(selectedValue);
      setLocalError(null);
      handleClose();
    

      if (selectedValue !== property.value) {
        try {
          const updatedProperty = { ...property, value: selectedValue };
          await onUpdate(updatedProperty);
          setLocalError(null);
        } catch (error) {
          setLocalError("Failed to update custom property.");
          // Revert on error
          setValue(property.value);
        }
      }
      
    };
    const handleBlur = async () => {
      // Only validate on blur, don't close dropdown here as it conflicts with option clicks
      if (property.is_required && value.trim() === "") {
        setLocalError("This field is required.");
        setValue(property.value);
      }
    };
    const filteredOptions = query === "" 
      ? options 
      : options.filter((option) => 
          option.label.toLowerCase().includes(query.toLowerCase()) ||
          option.value.toLowerCase().includes(query.toLowerCase())
        );

    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <div className="relative w-full">
        <Combobox
          as="div"
          ref={dropdownRef}
          value={value}
          onChange={handleChange}
          className="relative"
        >
          <Combobox.Button as={React.Fragment}>
            <button
              ref={setReferenceElement}
              type="button"
              onClick={() => {
                if (!isOpen) {
                  handleOpen();
                }
              }}
              className="text-sm w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-custom-primary-100 flex items-center justify-between"
            >
              <span className={cn("truncate", value ? "text-custom-text-500" : "text-custom-text-400")}>
                {selectedOption ? selectedOption.label : value || `Select ${property.key}`}
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-custom-text-400" />
            </button>
          </Combobox.Button>

          {isOpen && (
            <Combobox.Options className="fixed z-10" static>
              <div
                className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2 text-xs shadow-custom-shadow-rg focus:outline-none"
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                {options.length > 5 && !isLoading && (
                  <div className="sticky top-0 z-10 mb-2 bg-custom-background-100">
                    <input
                      type="text"
                      className="w-full rounded border border-custom-border-300 bg-custom-background-90 px-2 py-1 text-xs text-custom-text-100 placeholder:text-custom-text-400 focus:border-custom-primary-100 focus:outline-none"
                      placeholder="Search..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="max-h-48 space-y-1 overflow-y-scroll">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 px-1.5 py-4 text-custom-text-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading options...</span>
                    </div>
                  ) : filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <Combobox.Option
                        key={option.value}
                        value={option.value}
                        className={({ active, selected }) =>
                          cn(
                            "flex w-full cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5",
                            {
                              "bg-custom-background-80": active,
                              "text-custom-text-100": selected,
                              "text-custom-text-200": !selected,
                            }
                          )
                        }
                        onClick={() => {
                          // Close dropdown - onChange will handle the value update
                          handleClose();
                        }}
                      >
                        {({ selected }) => (
                          <>
                            <span className="flex-grow truncate">{option.label}</span>
                            {selected && <span className="text-custom-primary-100">✓</span>}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  ) : (
                    <div className="px-1.5 py-1 italic text-custom-text-400">No options found</div>
                  )}
                </div>
              </div>
            </Combobox.Options>
          )}
        </Combobox>
        {localError && (
          <div className="text-red-500 text-sm mt-1">{localError}</div>
        )}
      </div>
    );
  });

  const EditableProperty: React.FC<{ property: CustomProperty }> = React.memo(({ property }) => {
    const [value, setValue] = useState(property.value);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleBlur = async () => {
      if (property.is_required && value.trim() === "") {
        setLocalError("This field is required and cannot be left empty or consist of spaces.");
        setValue(property.value);
        return;
      }

      if (value !== property.value) {
        try {
          const updatedProperty = { ...property, value };
          await handlePropertyUpdate(updatedProperty);
          setLocalError(null);
        } catch (error) {
          setLocalError("Failed to update custom property.");
        }
      }

      setEditingPropertyKey(null);
      setLocalError(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValue(e.target.value);
      setLocalError(null);
    };

    // For dropdown type, use the CustomPropertyDropdown component
    if (property.data_type === "dropdown") {
      return (
        <CustomPropertyDropdown 
          property={property} 
          onUpdate={handlePropertyUpdate}
          onClose={() => setEditingPropertyKey(null)}
        />
      );
    }

    const inputComponents: Record<string, React.JSX.Element> = {
      date: (
        <Input
          type="date"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
          placeholder={`Add ${property.key}`}
          className="text-sm w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-custom-primary-100"
        />
      ),
      boolean: (
        <select
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
          className="text-sm w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-custom-primary-100"
        >
          <option value="">Select {property.key}</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      ),
      number: (
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
          placeholder={`Add ${property.key}`}
          className="text-sm w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-custom-primary-100"
        />
      ),
      text: (
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
          placeholder={`Add ${property.key}`}
          className="text-sm w-full border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-custom-primary-100"
        />
      ),
    };
    
    return (
      <div>
        {inputComponents[property?.data_type as keyof typeof inputComponents] || inputComponents.text}
        {localError && (
          <div className="text-red-500 text-sm mt-1">{localError}</div>
        )}
      </div>
    );
  });

  const labelWidth = layout === "two-fifths" ? "w-2/5" : "w-1/4";
  const valueWidth = layout === "two-fifths" ? "w-3/5" : "w-3/4";

  return (
    <div className="w-full">
      <hr className="flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-full mx-auto my-1" />

      <div className="space-y-2">
        {mergedCustomProperties.map((element) => (
          <div key={element.key} className="flex w-full items-center gap-3 min-h-8">
            <div className={`flex items-center gap-1 ${labelWidth} flex-shrink-0 text-sm text-custom-text-300 truncate`}>
              <span>
                {element.key}
                {element.is_required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </div>
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
                    <span className="text-sm text-custom-text-500 whitespace-nowrap overflow-hidden text-ellipsis" title={element.value}>
                      {element.value}
                    </span>
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