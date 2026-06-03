import type { IIssueDisplayProperties } from "@plane/types";
import { FilterDisplayCustomFields } from "./filter-display-custom-fields";

type Props = {
  displayProperties: IIssueDisplayProperties;
  handleUpdate: (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => void;
  projectId?: string;
};

export function AdditionalDisplayProperties(props: Props) {
  if (!props.projectId) return null;

  return <FilterDisplayCustomFields displayProperties={props.displayProperties} handleUpdate={props.handleUpdate} />;
}
