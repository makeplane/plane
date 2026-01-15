import { observer } from "mobx-react";

// plane imports
import { IMPORTERS_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TrashIcon } from "@plane/propel/icons";
import type { IImporterService } from "@plane/types";
import { CustomMenu } from "@plane/ui";
// icons
// helpers

import { renderFormattedDate } from "@plane/utils";
// types
// constants

type Props = {
  service: IImporterService;
  refreshing: boolean;
  handleDelete: () => void;
};

export const SingleImport = observer(function SingleImport({ service, refreshing, handleDelete }: Props) {
  const { t } = useTranslation();

  const importer = IMPORTERS_LIST.find((i) => i.provider === service.service);
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <div>
        <h4 className="flex items-center gap-2 text-13">
          {importer && (
            <span>
              Import from <span className="font-medium">{t(importer.i18n_title)}</span> to{" "}
            </span>
          )}
          <span className="font-medium">{service.project_detail.name}</span>
          <span
            className={`rounded-sm px-2 py-0.5 text-11 capitalize ${
              service.status === "completed"
                ? "bg-success-subtle text-success-primary"
                : service.status === "processing"
                  ? "bg-yellow-500/20 text-yellow-500"
                  : service.status === "failed"
                    ? "bg-danger-subtle text-danger-primary"
                    : ""
            }`}
          >
            {refreshing ? "Refreshing..." : service.status}
          </span>
        </h4>
        <div className="mt-2 flex items-center gap-2 text-11 text-secondary">
          <span>{renderFormattedDate(service.created_at)}</span>|
          <span>Imported by {service.initiated_by_detail?.display_name}</span>
        </div>
      </div>
      <CustomMenu ellipsis>
        <CustomMenu.MenuItem onClick={handleDelete}>
          <span className="flex items-center justify-start gap-2">
            <TrashIcon className="h-3.5 w-3.5" />
            Delete import
          </span>
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  );
});
