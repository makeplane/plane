import { Hash } from "lucide-react";
import { TArtifact } from "@/plane-web/types";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  data: TArtifact;
};

export const DeleteArchivePreviewCard = (props: TProps) => {
  const { data } = props;
  return (
    <WithPreviewHOC artifactId={data.artifact_id} shouldToggleSidebar={false}>
      <div className="flex gap-2 items-start justify-between">
        <div className="flex gap-2 items-center">
          <div className="flex items-center justify-center my-1">
            <Hash className="size-4 text-custom-text-100" />
          </div>
          <div className="truncate text-sm text-start">
            <span className="font-medium">{data.action === "delete" ? "Deleting " : "Archiving "}</span>{" "}
            {data.artifact_type}
            <span className="text-custom-text-200">{data.parameters?.name}</span>{" "}
          </div>
        </div>
      </div>
    </WithPreviewHOC>
  );
};
