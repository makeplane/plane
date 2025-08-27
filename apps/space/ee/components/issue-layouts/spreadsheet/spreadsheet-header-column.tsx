import { observer } from "mobx-react";
//types
import { IIssueDisplayProperties } from "@plane/types";
//components
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/with-display-properties-HOC";
import { HeaderColumn } from "./columns/header-column";

interface Props {
  displayProperties: IIssueDisplayProperties;
  property: keyof IIssueDisplayProperties;
}
export const SpreadsheetHeaderColumn = observer((props: Props) => {
  const { displayProperties, property } = props;

  return (
    <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey={property}>
      <th
        className="h-11 w-full min-w-36 max-w-48 items-center bg-custom-background-90 text-sm font-medium px-4 py-1 border border-b-0 border-t-0 border-custom-border-100"
        tabIndex={0}
      >
        <HeaderColumn property={property} />
      </th>
    </WithDisplayPropertiesHOC>
  );
});
