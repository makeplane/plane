import { Briefcase } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { TArtifact } from "@/plane-web/types";
import { Properties } from "./properties";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  data: TArtifact;
};

export const ProjectPreviewCard = (props: TProps) => {
  const { data } = props;
  const properties = { ...data.parameters?.properties };
  return (
    <WithPreviewHOC artifactId={data.artifact_id}>
      <div className="flex flex-col items-start">
        {/* header */}
        <div className="flex gap-2 items-center">
          {/*  icon */}
          <div className="flex h-8  w-8 items-center justify-center rounded-md bg-custom-background-80">
            <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
              {data.parameters?.logo_props ? (
                <Logo logo={data.parameters?.logo_props} size={16} />
              ) : (
                <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                  <Briefcase className="h-4 w-4" />
                </span>
              )}
            </span>
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="text-sm font-medium text-custom-text-100 truncate text-start capitalize">
              {data.parameters?.name || data.parameters?.project?.name || "Unknown"}
            </span>
            <span className="text-xs text-custom-text-300 truncate">
              {(data as TArtifact).project_identifier || data.parameters?.project?.identifier}
            </span>
          </div>
        </div>

        {/* properties */}
        {properties && <Properties {...properties} />}
      </div>
    </WithPreviewHOC>
  );
};
