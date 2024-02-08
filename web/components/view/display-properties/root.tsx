import { FC } from "react";
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

export const ViewDisplayPropertiesRoot: FC<TViewDisplayPropertiesRoot> = (props) => {
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
        <div
          key={property}
          className={`relative flex items-center gap-1 text-xs rounded p-0.5 px-2 border transition-all capitalize cursor-pointer
            ${
              false
                ? `border-custom-primary-100 bg-custom-primary-100`
                : `border-custom-border-300 hover:bg-custom-background-80`
            }
          `}
          onClick={() => {}}
        >
          {["key"].includes(property) ? "ID" : property.replaceAll("_", " ")}
        </div>
      ))}
    </div>
  );
};
