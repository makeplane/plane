import { useTranslation } from "@plane/i18n";
import {
  EmptyState,
  NoteHorizontalStackIllustration,
  ProjectHorizontalStackIllustration,
  WorkItemHorizontalStackIllustration,
} from "@plane/propel/empty-state";

const getDisplayContent = (type: string) => {
  switch (type) {
    case "project":
      return {
        icon: <ProjectHorizontalStackIllustration className="size-20" />,
        text: "home.recents.empty.project",
      };
    case "page":
      return {
        icon: <NoteHorizontalStackIllustration className="size-20" />,
        text: "home.recents.empty.page",
      };
    case "issue":
      return {
        icon: <WorkItemHorizontalStackIllustration className="size-20" />,
        text: "home.recents.empty.issue",
      };
    default:
      return {
        icon: <WorkItemHorizontalStackIllustration className="size-20" />,
        text: "home.recents.empty.default",
      };
  }
};

export const RecentsEmptyState = ({ type }: { type: string }) => {
  const { t } = useTranslation();

  const { icon, text } = getDisplayContent(type);

  return (
    <div className="flex items-center justify-center py-10 bg-custom-background-90 w-full">
      <EmptyState asset={icon} description={t(text)} type="simple" />
    </div>
  );
};
