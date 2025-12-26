import { ArchiveIcon, Earth } from "lucide-react";
import { EPageAccess } from "@plane/constants";
import { LockIcon } from "@plane/propel/icons";
import type { TPage } from "@plane/types";

export function PageAccessIcon(page: TPage) {
  return (
    <div>
      {page.archived_at ? (
        <ArchiveIcon className="h-2.5 w-2.5 text-tertiary" />
      ) : page.access === EPageAccess.PUBLIC ? (
        <Earth className="h-2.5 w-2.5 text-tertiary" />
      ) : (
        <LockIcon className="h-2.5 w-2.5 text-tertiary" />
      )}
    </div>
  );
}
