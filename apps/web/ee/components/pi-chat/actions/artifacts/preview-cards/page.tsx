import { FileText } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { TArtifact } from "@/plane-web/types";
import { Properties } from "./properties";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  data: TArtifact;
};

export const PagePreviewCard = (props: TProps) => {
  const { data } = props;
  const properties = { ...data.parameters?.properties, project: data.parameters?.project };
  return (
    <WithPreviewHOC artifactId={data.artifact_id}>
      <div className="flex gap-2 w-full">
        {data.parameters?.logo_props?.in_use ? (
          <Logo logo={data.parameters?.logo_props} size={16} type="lucide" />
        ) : (
          <FileText className="size-4 text-custom-text-100" />
        )}
        <div className="flex flex-col w-full overflow-hidden items-start">
          <div className="text-sm text-custom-text-100 font-medium truncate text-start capitalize">
            {data.parameters?.name || "Unknown"}
          </div>
          {properties && <Properties {...properties} />}
        </div>
      </div>
    </WithPreviewHOC>
  );
};
