import { ArchiveIcon } from "@plane/propel/icons";
import { Badge } from "./badge";

export const ArchivedBadge: React.FC = () => (
  <Badge text="Archived" icon={<ArchiveIcon className="size-2.5 text-custom-text-300" />} />
);
