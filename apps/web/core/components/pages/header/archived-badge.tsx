import { observer } from "mobx-react";
// plane imports
import { ArchiveIcon } from "@plane/propel/icons";
import { renderFormattedDate } from "@plane/utils";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageArchivedBadge = observer(function PageArchivedBadge({ page }: Props) {
  if (!page.archived_at) return null;

  return (
    <div className="flex-shrink-0 h-6 flex items-center gap-1 px-2 rounded-sm text-accent-primary bg-accent-primary/20">
      <ArchiveIcon className="flex-shrink-0 size-3.5" />
      <span className="text-11 font-medium">Archived at {renderFormattedDate(page.archived_at)}</span>
    </div>
  );
});
