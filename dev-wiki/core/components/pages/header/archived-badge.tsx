import { observer } from "mobx-react";
// plane imports
import { ArchiveIcon } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageArchivedBadge = observer(({ page }: Props) => {
  if (!page.archived_at) return null;

  return (
    <div className="flex-shrink-0 h-6 flex items-center gap-1 px-2 rounded text-custom-primary-100 bg-custom-primary-100/20">
      <ArchiveIcon className="flex-shrink-0 size-3.5" />
      <span className="text-xs font-medium">Archived at {renderFormattedDate(page.archived_at)}</span>
    </div>
  );
});
