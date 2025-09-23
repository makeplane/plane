import { Hash } from "lucide-react";
import { TArtifact } from "@/plane-web/types";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  data: TArtifact;
};

export const AddRemovePreviewCard = (props: TProps) => {
  const { data } = props;
  const artifactSubType = data.parameters.artifact_sub_type;
  const properties = artifactSubType && data.parameters?.properties[artifactSubType];

  return (
    <WithPreviewHOC artifactId={data.artifact_id} shouldToggleSidebar={false}>
      <div className="flex gap-2 items-start justify-between">
        <div className="flex gap-2 items-start">
          <div className="flex items-center justify-center my-1">
            <Hash className="size-4 text-custom-text-100" />
          </div>
          <div className="flex flex-wrap gap-1 truncate text-sm text-start my-auto">
            <span className="font-medium">{data.action === "add" ? "Adding " : "Removing "}</span> {data.artifact_type}{" "}
            <span className="text-custom-text-100 font-medium">{data.parameters?.name}</span>{" "}
            {data.action === "add" ? "to" : "from"} {artifactSubType}
            {properties && properties.length > 0 ? "s" : ""}
            {properties &&
              properties.map(
                (
                  property: {
                    name: string;
                  },
                  index: number
                ) => (
                  <span key={property.name} className="text-custom-text-100 font-medium">
                    {property.name}
                    {index < properties.length - 1 ? ", " : ""}
                  </span>
                )
              )}
          </div>
        </div>
      </div>
    </WithPreviewHOC>
  );
};
