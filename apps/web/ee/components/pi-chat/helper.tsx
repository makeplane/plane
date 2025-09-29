import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { FileText } from "lucide-react";
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/propel/icons";
import { IFormattedValue, IItem } from "@/plane-web/types/pi-chat";
import { IssueIdentifier } from "../issues/issue-details/issue-identifier";

export const parseDataStream = (dataStream: string) =>
  // Split the input by newline and filter out lines that start with 'data: '
  dataStream
    .split("\n") // Split input into lines
    .filter((line) => line.startsWith("data: ")) // Keep only lines that start with 'data: '
    .map((line) => line.replace("data: ", "")) // Remove the 'data: ' prefix
    .join("") // Join all characters into a single string
    .replace("[DONE]", "");

export const scrollIntoViewHelper = async (elementId: string) => {
  const sourceElementId = elementId ?? "";
  const sourceElement = document.getElementById(sourceElementId);
  if (sourceElement) await smoothScrollIntoView(sourceElement, { behavior: "smooth", block: "center", duration: 1500 });
};

export const getIcon = (type: string, item: Partial<IItem>) => {
  switch (type) {
    case "issue":
      return (
        <IssueIdentifier
          issueTypeId={item.type_id}
          projectId={item.project_id || ""}
          projectIdentifier={item.project__identifier || ""}
          issueSequenceId={item.sequence_id || ""}
          textContainerClassName="text-custom-sidebar-text-400 text-xs whitespace-nowrap"
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
