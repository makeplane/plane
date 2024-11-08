import { FileText } from "lucide-react";
import { ContrastIcon, DiceIcon, LayersIcon } from "@plane/ui";

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
}

export interface IFormattedValue {
  [key: string]: Partial<IItem>[] | undefined;
}
const getIcon = (type: string) => {
  switch (type) {
    case "cycle":
      return <ContrastIcon />;
    case "module":
      return <DiceIcon />;
    case "page":
      return <FileText />;
    default:
      return <LayersIcon />;
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
      icon: getIcon(type),
    }));
  });
  return parsedResponse;
};
