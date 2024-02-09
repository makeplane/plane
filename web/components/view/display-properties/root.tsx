import { FC, Fragment } from "react";
import { observer } from "mobx-react-lite";
// components
import { ViewDisplayPropertySelection } from "../";
// types
import { TViewDisplayProperties, TViewTypes } from "@plane/types";
import { TViewOperations } from "../types";

type TViewDisplayPropertiesRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
};

export const ViewDisplayPropertiesRoot: FC<TViewDisplayPropertiesRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations } = props;

  const displayProperties: Partial<keyof TViewDisplayProperties>[] = [
    "key",
    "state",
    "labels",
    "priority",
    "assignee",
    "start_date",
    "due_date",
    "sub_issue_count",
    "attachment_count",
    "estimate",
    "link",
  ];

  return (
    <div className="relative flex items-center flex-wrap gap-2">
      {displayProperties.map((property) => (
        <Fragment key={property}>
          <ViewDisplayPropertySelection
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            viewId={viewId}
            viewType={viewType}
            viewOperations={viewOperations}
            property={property}
          />
        </Fragment>
      ))}
    </div>
  );
});
