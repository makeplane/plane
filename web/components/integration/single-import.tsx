// ui
import { CustomMenu } from "@plane/ui";
// icons
import { Trash2 } from "lucide-react";
// helpers
import { renderFormattedDate } from "helpers/date-time.helper";
// types
import { IImporterService } from "@plane/types";
// constants
import { IMPORTERS_LIST } from "constants/workspace";

type Props = {
  service: IImporterService;
  refreshing: boolean;
  handleDelete: () => void;
};

export const SingleImport: React.FC<Props> = ({ service, refreshing, handleDelete }) => (
  <div className="flex items-center justify-between gap-2 px-4 py-3">
    <div>
      <h4 className="flex items-center gap-2 text-sm">
        <span>
          Import from{" "}
          <span className="font-medium">{IMPORTERS_LIST.find((i) => i.provider === service.service)?.title}</span> to{" "}
          <span className="font-medium">{service.project_detail.name}</span>
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs capitalize ${
            service.status === "completed"
              ? "bg-success-component-surface-dark text-success-text-medium"
              : service.status === "processing"
              ? "bg-warning-component-surface-light text-warning-text-subtle"
              : service.status === "failed"
              ? "bg-danger-component-surface-dark text-danger-text-medium"
              : ""
          }`}
        >
          {refreshing ? "Refreshing..." : service.status}
        </span>
      </h4>
      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-text-medium">
        <span>{renderFormattedDate(service.created_at)}</span>|
        <span>Imported by {service.initiated_by_detail.display_name}</span>
      </div>
    </div>
    <CustomMenu ellipsis>
      <CustomMenu.MenuItem onClick={handleDelete}>
        <span className="flex items-center justify-start gap-2">
          <Trash2 className="h-3.5 w-3.5" />
          Delete import
        </span>
      </CustomMenu.MenuItem>
    </CustomMenu>
  </div>
);
