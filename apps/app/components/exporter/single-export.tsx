import React from "react";
// next imports
import Link from "next/link";
// ui
import { PrimaryButton } from "components/ui"; // icons
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IExportData } from "types";

type Props = {
  service: IExportData;
  refreshing: boolean;
};

export const SingleExport: React.FC<Props> = ({ service, refreshing }) => {
  const provider = service.provider;
  const [isLoading, setIsLoading] = React.useState(false);
  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <div>
        <h4 className="flex items-center gap-2 text-sm">
          <span>
            Export to{" "}
            <span className="font-medium">
              {provider === "csv"
                ? "CSV"
                : provider === "xlsx"
                ? "Excel"
                : provider === "json"
                ? "JSON"
                : ""}
            </span>{" "}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs capitalize ${
              service.status === "completed"
                ? "bg-green-500/20 text-green-500"
                : service.status === "processing"
                ? "bg-yellow-500/20 text-yellow-500"
                : service.status === "failed"
                ? "bg-red-500/20 text-red-500"
                : ""
            }`}
          >
            {refreshing ? "Refreshing..." : service.status}
          </span>
        </h4>
        <div className="mt-2 flex items-center gap-2 text-xs text-custom-text-200">
          <span>{renderShortDateWithYearFormat(service.created_at)}</span>|
          <span>Exported by {service?.initiated_by_detail?.display_name}</span>
        </div>
      </div>
      {service.status == "completed" && (
        <div>
          <Link href={service?.url}>
            <PrimaryButton className="w-full text-center">
              {isLoading ? "Downloading..." : "Download"}
            </PrimaryButton>
          </Link>
        </div>
      )}
    </div>
  );
};
