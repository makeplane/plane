import React from "react";

type CustomProperty = {
  key: string;
  value: string;
  issue_type_custom_property: string;
};

type CustomPropertiesProps = {
  customProperties?: CustomProperty[]; 
};

export const CustomProperties: React.FC<CustomPropertiesProps> = ({ customProperties }) => {
  if (!Array.isArray(customProperties) || customProperties.length === 0) {
    return null; 
  }

  return (
    <div className="w-full">
      <hr className="flex-shrink-0 border-custom-sidebar-border-300 h-[0.5px] w-full mx-auto my-1" />
      {customProperties.map((element) => (
        <div key={element.key} className="flex min-h-8 gap-2 align-items-center">
          <div className="flex w-2/5 flex-shrink-0 gap-1 pt-2 text-sm text-custom-text-300">
            <span>{element.key}</span>
          </div>
          <div className="h-full min-h-8 w-3/5 mt-1 ml-5 flex-grow">
            <span className="text-sm">{element.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
