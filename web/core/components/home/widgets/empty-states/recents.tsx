import { Briefcase, FileText, History } from "lucide-react";
// plane ui
import { LayersIcon } from "@plane/ui";

const getDisplayContent = (type: string) => {
  switch (type) {
    case "project":
      return {
        icon: Briefcase,
        text: "Projects you go into or have assigned work in will show up here.",
      };
    case "page":
      return {
        icon: FileText,
        text: "Create, see, or change something on pages you have access to and see them here.",
      };
    case "issue":
      return {
        icon: LayersIcon,
        text: "Let's see some issues to see them show up here.",
      };
    default:
      return {
        icon: History,
        text: "Whatever you see and act on in Plane will show up here.",
      };
  }
};

export const RecentsEmptyState = ({ type }: { type: string }) => {
  const displayContent = getDisplayContent(type);

  return (
    <div className="min-h-[110px] w-full flex items-center justify-center gap-2 py-6 bg-custom-background-90 text-custom-text-400 rounded">
      <div className="flex-shrink-0 size-[30px] grid place-items-center">
        <displayContent.icon className="size-6" />
      </div>
      <p className="text-sm text-center font-medium">{displayContent.text}</p>
    </div>
  );
};
