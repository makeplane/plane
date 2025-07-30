import { Download } from "lucide-react";
import { IExportData } from "@plane/types";
import { getDate, getFileURL, renderFormattedDate } from "@plane/utils";

type RowData = IExportData;
const checkExpiry = (inputDateString: string) => {
  const currentDate = new Date();
  const expiryDate = getDate(inputDateString);
  if (!expiryDate) return false;
  expiryDate.setDate(expiryDate.getDate() + 7);
  return expiryDate > currentDate;
};
export const useExportColumns = () => {
  const columns = [
    {
      key: "Exported By",
      content: "Exported By",
      tdRender: (rowData: RowData) => {
        const { avatar_url, display_name, email } = rowData.initiated_by_detail;
        return (
          <div className="flex items-center gap-x-2">
            <div>
              {avatar_url && avatar_url.trim() !== "" ? (
                <span className="relative flex h-4 w-4 items-center justify-center rounded-full capitalize text-white">
                  <img
                    src={getFileURL(avatar_url)}
                    className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                    alt={display_name || email}
                  />
                </span>
              ) : (
                <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-gray-700 capitalize text-white text-xs">
                  {(email ?? display_name ?? "?")[0]}
                </span>
              )}
            </div>
            <div>{display_name}</div>
          </div>
        );
      },
    },
    {
      key: "Exported On",
      content: "Exported On",
      tdRender: (rowData: RowData) => <span>{renderFormattedDate(rowData.created_at)}</span>,
    },

    {
      key: "Exported projects",
      content: "Exported projects",
      tdRender: (rowData: RowData) => <div className="text-sm">{rowData.project.length} project(s)</div>,
    },
    {
      key: "Format",
      content: "Format",
      tdRender: (rowData: RowData) => (
        <span className="text-sm">
          {rowData.provider === "csv"
            ? "CSV"
            : rowData.provider === "xlsx"
              ? "Excel"
              : rowData.provider === "json"
                ? "JSON"
                : ""}
        </span>
      ),
    },
    {
      key: "Status",
      content: "Status",
      tdRender: (rowData: RowData) => (
        <span
          className={`rounded text-xs px-2 py-1 capitalize ${
            rowData.status === "completed"
              ? "bg-green-500/20 text-green-500"
              : rowData.status === "processing"
                ? "bg-yellow-500/20 text-yellow-500"
                : rowData.status === "failed"
                  ? "bg-red-500/20 text-red-500"
                  : rowData.status === "expired"
                    ? "bg-orange-500/20 text-orange-500"
                    : "bg-gray-500/20 text-gray-500"
          }`}
        >
          {rowData.status}
        </span>
      ),
    },
    {
      key: "Download",
      content: "Download",
      tdRender: (rowData: RowData) =>
        checkExpiry(rowData.created_at) ? (
          <>
            {rowData.status == "completed" ? (
              <a target="_blank" href={rowData?.url} rel="noopener noreferrer">
                <button className="w-full flex items-center gap-1 text-custom-primary-100 font-medium">
                  <Download className="h-4 w-4" />
                  <div>Download</div>
                </button>
              </a>
            ) : (
              "-"
            )}
          </>
        ) : (
          <div className="text-xs text-red-500">Expired</div>
        ),
    },
  ];
  return columns;
};
