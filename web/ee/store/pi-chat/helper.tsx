import { FileText } from "lucide-react";
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/ui";
import { IssueIdentifier } from "@/plane-web/components/issues";

interface IItem {
  id: string;
  label: string;
  entity_name: string;
  entity_identifier: string;
  target: string;
  redirect_uri: string;
  name?: string;
  project__identifier?: string;
  sequence_id?: string;
  title: string;
  subTitle: string | undefined;
  type_id: string;
  project_id: string;
}

export interface IFormattedValue {
  [key: string]: Partial<IItem>[] | undefined;
}
const getIcon = (type: string, item: Partial<IItem>) => {
  switch (type) {
    case "issue":
      return (
        <IssueIdentifier
          issueTypeId={item.type_id}
          projectId={item.project_id || ""}
          projectIdentifier={item.project__identifier || ""}
          issueSequenceId={item.sequence_id || ""}
          textContainerClassName="text-custom-sidebar-text-400 text-xs"
        />
      );
    case "cycle":
      return <ContrastIcon className="w-4 h-4" />;
    case "module":
      return <DiceIcon className="w-4 h-4" />;
    case "page":
      return <FileText className="w-4 h-4" />;
    default:
      return <LayersIcon className="w-4 h-4" />;
  }
};
export const formatSearchQuery = (data: Partial<IFormattedValue>): IFormattedValue => {
  const parsedResponse: IFormattedValue = {
    cycle: [],
    module: [],
    page: [],
    issue: [],
  };
  Object.keys(data).forEach((type) => {
    parsedResponse[type] = data[type]?.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.name,
      subTitle: type === "issue" ? `${item.project__identifier}-${item.sequence_id}` : undefined,
      icon: getIcon(type, item),
    }));
  });
  return parsedResponse;
};
