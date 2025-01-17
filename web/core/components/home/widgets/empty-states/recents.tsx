import { Briefcase, FileText, History } from "lucide-react";
import { LayersIcon } from "@plane/ui";

export const RecentsEmptyState = ({ type }: { type: string }) => {
  const getDisplayContent = () => {
    switch (type) {
      case "project":
        return {
          icon: <Briefcase size={30} className="text-custom-text-400/40" />,
          text: "Your recent projects will appear here once you visit one.",
        };
      case "page":
        return {
          icon: <FileText size={30} className="text-custom-text-400/40" />,
          text: "Your recent pages will appear here once you visit one.",
        };
      case "issue":
        return {
          icon: <LayersIcon className="text-custom-text-400/40 w-[30px] h-[30px]" />,
          text: "Your recent issues will appear here once you visit one.",
        };
      default:
        return {
          icon: <History size={30} className="text-custom-text-400/40" />,
          text: "You don’t have any recent items yet.",
        };
    }
  };
  const { icon, text } = getDisplayContent();

  return (
    <div className="min-h-[120px] flex w-full justify-center py-6 bg-custom-border-100 rounded">
      <div className="m-auto flex gap-2">
        {icon} <div className="text-custom-text-400 text-sm text-center my-auto">{text}</div>
      </div>
    </div>
  );
};
