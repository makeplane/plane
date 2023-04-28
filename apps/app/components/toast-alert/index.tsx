import React from "react";
// hooks
import useToast from "hooks/use-toast";
// icons
import { LinkIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ErrorIcon, SuccessIcon } from "components/icons";

const ToastAlerts = () => {
  const { alerts, removeAlert } = useToast();

  if (!alerts) return null;

  return (
    <div className="pointer-events-none fixed top-5 right-5 z-50 h-full w-96 space-y-5 overflow-hidden rounded-md">
      {alerts.map((alert) => (
        <div
          className="relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-md border-[2px] border-brand-surface-2 bg-brand-base px-4 py-3 text-sm text-brand-base shadow-md"
          key={alert.id}
        >
          <div className="absolute top-1 right-1">
            <button
              type="button"
              className="pointer-events-auto inline-flex rounded-md p-1.5 text-brand-secondary"
              onClick={() => removeAlert(alert.id)}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {alert.type !== "info" ? (
            <>
              <div className="flex w-full items-center gap-2.5">
                {alert.type === "success" ? (
                  <SuccessIcon className="h-4 w-4" />
                ) : alert.type === "error" ? (
                  <ErrorIcon className="h-4 w-4" />
                ) : (
                  ""
                )}
                <p
                  className={`font-medium  ${
                    alert.type === "success"
                      ? "text-brand-base"
                      : alert.type === "error"
                      ? "text-[#ef476f]"
                      : alert.type === "warning"
                      ? "text-[#e98601]"
                      : "text-[#1B9aaa]"
                  }`}
                >
                  {alert.title}
                </p>
              </div>
              <div className="flex w-full items-center justify-start text-brand-secondary">
                <p className="text-left">{alert.message}</p>
              </div>
            </>
          ) : (
            <div className="flex w-full items-center justify-center gap-2.5 py-2 text-brand-secondary">
              {alert.iconType === "copy" && (
                <span>
                  <LinkIcon className="h-4 w-4" />
                </span>
              )}
              <p className="font-medium italic">{alert.title}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ToastAlerts;
