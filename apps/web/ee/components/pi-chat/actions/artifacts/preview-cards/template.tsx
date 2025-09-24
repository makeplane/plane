import { TArtifact } from "@/plane-web/types";
import { getIcon } from "../../preview-block";
import { Properties } from "./properties";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  data: TArtifact;
};

export const TemplatePreviewCard = (props: TProps) => {
  const { data } = props;
  const properties = { ...data.parameters?.properties, project: data.parameters?.project };
  return (
    <WithPreviewHOC artifactId={data.artifact_id} shouldToggleSidebar={false}>
      <div className="flex gap-2 items-start justify-between">
        <div className="flex gap-2 items-start">
          <div className="flex items-center justify-center my-1">
            {getIcon(data.artifact_type, data.parameters?.color?.name || data.parameters?.properties?.color?.name)}
          </div>
          <div className="flex flex-col">
            <div className="truncate text-sm font-medium text-start capitalize">
              {data.parameters?.name || "Unknown"}
            </div>
            {data.parameters?.properties && <Properties {...properties} />}
          </div>
        </div>
        <div>
          <div className="bg-custom-background-90 rounded-full py-0.5 px-2 capitalize text-xs text-custom-text-200 font-medium">
            {data.artifact_type}
          </div>
        </div>
      </div>
    </WithPreviewHOC>
  );
};
