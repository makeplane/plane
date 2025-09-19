import { TArtifact } from "@/plane-web/types";
import { PreviewCard } from "../preview-cards/root";

export const PiChatArtifactsListRoot = (props: { artifacts: TArtifact[] }) => {
  const { artifacts } = props;
  return (
    <div className="flex flex-col gap-4">
      {artifacts.map((artifact) => (
        <PreviewCard key={artifact.artifact_id} artifact={artifact.artifact_id} />
      ))}
    </div>
  );
};
