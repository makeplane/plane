import { ContrastIcon } from "@plane/propel/icons";
import { TArtifact } from "@/plane-web/types";
import { Properties } from "./properties";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  data: TArtifact;
};

export const CyclePreviewCard = (props: TProps) => {
  const { data } = props;
  const properties = { ...data.parameters?.properties, project: data.parameters?.project };
  return (
    <WithPreviewHOC artifactId={data.artifact_id}>
      <div className="flex gap-2 items-start">
        <ContrastIcon className="size-4 text-custom-text-100 my-0.5" />
        <div className="flex flex-col">
          <div className="truncate text-sm font-medium text-start capitalize">{data.parameters?.name || "Unknown"}</div>
          {properties && <Properties {...properties} />}
        </div>
      </div>
    </WithPreviewHOC>
  );
};
