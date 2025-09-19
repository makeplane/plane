import { observer } from "mobx-react";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { TArtifact } from "@/plane-web/types";
import { CyclePreviewCard } from "../preview-cards/cycle";
import { ModulePreviewCard } from "../preview-cards/module";
import { PagePreviewCard } from "../preview-cards/page";
import { ProjectPreviewCard } from "../preview-cards/project";
import { ViewPreviewCard } from "../preview-cards/view";
import { WorkItemPreviewCard } from "../preview-cards/work-item";
import { AddRemovePreviewCard } from "./add-remove";
import { DeleteArchivePreviewCard } from "./delete-archieve";
import { TemplatePreviewCard } from "./template";

const PreviewCardRenderer = (props: { data: TArtifact }) => {
  const { data } = props;
  if (["create", "update"].includes(data.action)) {
    switch (data.artifact_type) {
      case "workitem":
        return <WorkItemPreviewCard data={data} />;
      case "page":
        return <PagePreviewCard data={data} />;
      case "cycle":
        return <CyclePreviewCard data={data} />;
      case "module":
        return <ModulePreviewCard data={data} />;
      case "view":
        return <ViewPreviewCard data={data} />;
      case "project":
        return <ProjectPreviewCard data={data} />;
      default:
        return <TemplatePreviewCard data={data} />;
    }
  } else if (["add", "remove"].includes(data.action)) {
    return <AddRemovePreviewCard data={data} />;
  } else if (["delete", "archive"].includes(data.action)) {
    return <DeleteArchivePreviewCard data={data} />;
  } else {
    return <TemplatePreviewCard data={data} />;
  }
};

export const PreviewCard = observer((props: { artifact: string }) => {
  const { artifact } = props;
  const {
    artifactsStore: { getArtifact },
  } = usePiChat();
  // derived
  const artifactsData = getArtifact(artifact);
  if (!artifactsData) return null;

  return <PreviewCardRenderer data={artifactsData} />;
});
