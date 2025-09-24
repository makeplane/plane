import { LayersIcon } from "@plane/propel/icons";
import { TArtifact } from "@/plane-web/types";
import { Properties } from "./properties";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  data: TArtifact;
};

export const WorkItemPreviewCard = (props: TProps) => {
  const { data } = props;
  const properties = { ...data.parameters?.properties, project: data.parameters?.project };
  return (
    <WithPreviewHOC artifactId={data.artifact_id}>
      <div className="flex flex-col gap-2 items-start">
        {/* header */}
        <div className="flex gap-2 items-center">
          {/* issue type icon */}
          <LayersIcon className="size-4 rounded" />
          <div className="text-sm font-medium text-custom-text-350">
            {(data as TArtifact).issue_identifier ||
              (data as TArtifact).project_identifier ||
              data.parameters?.project?.identifier}
          </div>
        </div>
        <div>
          {/* title */}
          <div className="truncate text-sm font-medium text-start">{data.parameters?.name}</div>
          {/* properties */}
          {properties && <Properties {...properties} />}
        </div>
      </div>
    </WithPreviewHOC>
  );
};
