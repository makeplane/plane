import { useEffect, useState } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { renderFormattedDate } from "@plane/utils";
import type { TDevice } from "../devices.types";

type TDevicesGridProps = {
  devices: TDevice[];
  copiedDeviceId: number | null;
  isLoading: boolean;
  isMutating: boolean;
  onCopyUrl: (device: TDevice) => void;
  onEdit: (device: TDevice) => void;
  onDelete: (device: TDevice) => void;
};

export const DevicesGrid = ({
  devices,
  copiedDeviceId,
  isLoading,
  isMutating,
  onCopyUrl,
  onEdit,
  onDelete,
}: TDevicesGridProps) => {
  const getCreatedDate = (createdAt: string | null) => {
    if (!createdAt) return "-";
    return renderFormattedDate(createdAt) ?? createdAt.slice(0, 10);
  };

  const _getMaskedPin = (pin: string) => (pin.trim().length > 0 ? "••••" : "-");

  const actionButtonClassName =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-custom-background-80 px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <article
            key={`device-skeleton-${index}`}
            className="overflow-hidden rounded-xl border border-custom-border-200 bg-gradient-to-b from-custom-background-100 to-custom-background-90"
          >
            <div className="space-y-2 px-5 pb-4 pt-5">
              <div className="h-7 w-2/3 animate-pulse rounded bg-custom-background-80" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-custom-background-80" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-custom-background-80" />
            </div>

            <div className="border-t border-custom-border-200 px-5 py-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="h-9 animate-pulse rounded-md bg-custom-background-80" />
                <div className="h-9 animate-pulse rounded-md bg-custom-background-80" />
                <div className="h-9 animate-pulse rounded-md bg-custom-background-80" />
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (devices.length === 0) {
    return <p className="text-sm text-custom-text-300">No devices found.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {devices.map((device) => (
        <article
          key={device.id}
          className="overflow-hidden rounded-xl border border-custom-border-200 bg-gradient-to-b from-custom-background-100 to-custom-background-90"
        >
          <div className="space-y-2 px-5 pb-4 pt-5">
            <h4 className="truncate text-lg font-semibold leading-tight text-custom-text-100">{device.deviceName}</h4>
            <p className="truncate text-sm text-custom-text-300">Application Name: {device.appName || "-"}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-custom-text-300">
              <span>Device Type: {device.deviceType || "-"}</span>
              {/* <span>PIN: {getMaskedPin(device.pin)}</span> */}
            </div>
          </div>

          <div className="border-t border-custom-border-200 px-5 py-3">
            <div className="grid grid-cols-3 gap-2">
              <Tooltip tooltipContent={device.streamingUrl} position="top" disabled={!device.streamingUrl}>
                <button
                  type="button"
                  className={`${actionButtonClassName} text-custom-text-100 hover:bg-custom-background-70`}
                  onClick={() => onCopyUrl(device)}
                  disabled={isMutating || !device.streamingUrl}
                  aria-label={`Copy URL: ${device.streamingUrl}`}
                >
                  <Copy className="h-3.5 w-3.5 text-[#8ec4ff]" />
                  {copiedDeviceId === device.id ? "Copied" : "Copy URL"}
                </button>
              </Tooltip>

              <button
                type="button"
                className={`${actionButtonClassName} text-custom-text-100 hover:bg-custom-background-70`}
                onClick={() => onEdit(device)}
                disabled={isMutating}
              >
                <Pencil className="h-3.5 w-3.5 text-[#8ec4ff]" />
                Edit
              </button>

              <button
                type="button"
                className={`${actionButtonClassName} text-red-500 hover:bg-red-500/10`}
                onClick={() => onDelete(device)}
                disabled={isMutating}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};
