import { Briefcase, FileText, History } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { LayersIcon } from "@plane/ui";

const getDisplayContent = (type: string) => {
  switch (type) {
    case "project":
      return {
        icon: <Briefcase size={30} className="text-custom-text-400/40" />,
        text: "home.recents.empty.project",
      };
    case "page":
      return {
        icon: <FileText size={30} className="text-custom-text-400/40" />,
        text: "home.recents.empty.page",
      };
    case "issue":
      return {
        icon: <LayersIcon className="text-custom-text-400/40 w-[30px] h-[30px]" />,
        text: "home.recents.empty.issue",
      };
    default:
      return {
        icon: <History size={30} className="text-custom-text-400/40" />,
        text: "home.recents.empty.default",
      };
  }
};
export const RecentsEmptyState = ({ type }: { type: string }) => {
  const { t } = useTranslation();

  const { icon, text } = getDisplayContent(type);

  return (
    <div className="min-h-[120px] flex w-full justify-center py-6 bg-custom-border-100 rounded">
      <div className="m-auto flex gap-2">
        {icon} <div className="text-custom-text-400 text-sm text-center my-auto">{t(text)}</div>
      </div>
    </div>
  );
};
