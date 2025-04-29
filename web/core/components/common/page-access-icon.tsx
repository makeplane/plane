import { ArchiveIcon, Earth, Lock } from "lucide-react";
import { EPageAccess } from "@plane/constants";
import { TPage } from "@plane/types";

export const PageAccessIcon = (page: TPage) => (
  <div>
    {page.archived_at ? (
      <ArchiveIcon className="h-2.5 w-2.5 text-custom-text-300" />
    ) : page.access === EPageAccess.PUBLIC ? (
      <Earth className="h-2.5 w-2.5 text-custom-text-300" />
    ) : (
      <Lock className="h-2.5 w-2.5 text-custom-text-300" />
    )}
  </div>
);
