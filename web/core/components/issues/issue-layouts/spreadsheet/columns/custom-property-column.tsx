import React from "react";
import { observer } from "mobx-react";
// types
import { TIssue } from "@plane/types";
import { Row, Tooltip } from "@plane/ui";

type Props = {
  issue: TIssue;
  property: string;
};

export const SpreadsheetCustomPropertiesColumn: React.FC<Props> = observer((props) => {
  const { issue, property } = props;
  const customProperties = issue?.custom_properties ?? [];
  const propertyValue = customProperties.find(item => item.hasOwnProperty(property))?.[property] ?? "N/A";

  return (
    <Tooltip tooltipContent={propertyValue !== "N/A" ? propertyValue : "No data available"}>
      <Row className="h-11 truncate border-b-[0.5px] border-custom-border-200 pt-[1.25em] text-xs hover:bg-custom-background-80">
        {propertyValue}
      </Row>
    </Tooltip>
  );
});
