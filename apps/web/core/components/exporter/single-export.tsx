import type { FC } from "react";
import { useState } from "react";
// ui
import { Button } from "@plane/propel/button";
import type { IExportData } from "@plane/types";
// helpers
import { getDate, renderFormattedDate } from "@plane/utils";
// types

type Props = {
  service: IExportData;
  refreshing: boolean;
};

export function SingleExport({ service, refreshing }: Props) {
  const provider = service.provider;

  const [isLoading] = useState(false);

  const checkExpiry = (inputDateString: string) => {
    const currentDate = new Date();
    const expiryDate = getDate(inputDateString);
    if (!expiryDate) return false;
    expiryDate.setDate(expiryDate.getDate() + 7);
    return expiryDate > currentDate;
  };

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <div>
        <h4 className="flex items-center gap-2 text-13">
          <span>
            Export to{" "}
            <span className="font-medium">
              {provider === "csv" ? "CSV" : provider === "xlsx" ? "Excel" : provider === "json" ? "JSON" : ""}
            </span>{" "}
          </span>
          <span
            className={`rounded-sm px-2 py-0.5 text-11 capitalize ${
              service.status === "completed"
                ? "bg-success-subtle text-success-primary"
                : service.status === "processing"
                  ? "bg-yellow-500/20 text-yellow-500"
                  : service.status === "failed"
                    ? "bg-danger-subtle text-danger-primary"
                    : service.status === "expired"
                      ? "bg-orange-500/20 text-orange-500"
                      : ""
            }`}
          >
            {refreshing ? "Refreshing..." : service.status}
          </span>
        </h4>
        <div className="mt-2 flex items-center gap-2 text-11 text-secondary">
          <span>{renderFormattedDate(service.created_at)}</span>|
          <span>Exported by {service?.initiated_by_detail?.display_name}</span>
        </div>
      </div>
      {checkExpiry(service.created_at) ? (
        <>
          {service.status == "completed" && (
            <div>
              <a target="_blank" href={service?.url} rel="noopener noreferrer">
                <Button variant="primary" className="w-full">
                  {isLoading ? "Downloading..." : "Download"}
                </Button>
              </a>
            </div>
          )}
        </>
      ) : (
        <div className="text-11 text-danger-primary">Expired</div>
      )}
    </div>
  );
}
