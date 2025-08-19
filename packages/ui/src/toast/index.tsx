import { Toast as BaseToast } from "@base-ui-components/react/toast";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
import * as React from "react";
// icons
// spinner
import { CircularBarSpinner } from "../spinners";
// helper
import { cn } from "../utils";

export enum TOAST_TYPE {
  SUCCESS = "success",
  ERROR = "error",
  INFO = "info",
  WARNING = "warning",
  LOADING = "loading",
}

type SetToastProps =
  | {
      type: TOAST_TYPE.LOADING;
      title?: string;
    }
  | {
      id?: string | number;
      type: Exclude<TOAST_TYPE, TOAST_TYPE.LOADING>;
      title: string;
      message?: string;
      actionItems?: React.ReactNode;
    };

type PromiseToastCallback<ToastData> = (data: ToastData) => string;
type ActionItemsPromiseToastCallback<ToastData> = (data: ToastData) => React.ReactNode;

type PromiseToastData<ToastData> = {
  title: string;
  message?: PromiseToastCallback<ToastData>;
  actionItems?: ActionItemsPromiseToastCallback<ToastData>;
};

type PromiseToastOptions<ToastData> = {
  loading?: string;
  success: PromiseToastData<ToastData>;
  error: PromiseToastData<ToastData>;
};

type ToastProps = {
  theme: "light" | "dark" | "system";
};

// Global toast manager to allow triggering from anywhere
const toastManager = BaseToast.createToastManager();

export const Toast = (props: ToastProps) => {
  const { theme } = props;

  return (
    <BaseToast.Provider toastManager={toastManager} limit={5} timeout={4000}>
      <BaseToast.Viewport
        render={(vpProps) => (
          <div
            {...vpProps}
            className={cn(
              vpProps.className,
              "fixed isolate z-[100] bottom-4 right-4 flex w-full max-w-[420px] flex-col gap-3 px-4",
              "data-[expanded]:[&>*]:translate-y-[var(--toast-offset-y)]"
            )}
          >
            {vpProps.children}
          </div>
        )}
      >
        <ToastList />
      </BaseToast.Viewport>
      <div data-theme={theme} />
    </BaseToast.Provider>
  );
};

function ToastList() {
  const { toasts } = BaseToast.useToastManager();

  return toasts.map((t) => {
    const type =
      ((t as any).type as TOAST_TYPE) || (((t.data as any) && (t.data as any).tone) as TOAST_TYPE) || TOAST_TYPE.INFO;

    const classesByType = (toastType: TOAST_TYPE) => {
      switch (toastType) {
        case TOAST_TYPE.SUCCESS:
          return {
            text: "text-toast-text-success",
            bg: "bg-toast-background-success",
            border: "border-toast-border-success",
            icon: <CheckCircle2 width={24} height={24} strokeWidth={1.5} className="text-toast-text-success" />,
          };
        case TOAST_TYPE.ERROR:
          return {
            text: "text-toast-text-error",
            bg: "bg-toast-background-error",
            border: "border-toast-border-error",
            icon: <XCircle width={24} height={24} strokeWidth={1.5} className="text-toast-text-error" />,
          };
        case TOAST_TYPE.WARNING:
          return {
            text: "text-toast-text-warning",
            bg: "bg-toast-background-warning",
            border: "border-toast-border-warning",
            icon: <AlertTriangle width={24} height={24} strokeWidth={1.5} className="text-toast-text-warning" />,
          };
        case TOAST_TYPE.LOADING:
          return {
            text: "text-toast-text-loading",
            bg: "bg-toast-background-loading",
            border: "border-toast-border-loading",
            icon: <CircularBarSpinner className="text-toast-text-tertiary" />,
          };
        case TOAST_TYPE.INFO:
        default:
          return {
            text: "text-toast-text-info",
            bg: "bg-toast-background-info",
            border: "border-toast-border-info",
            icon: undefined as React.ReactNode | undefined,
          };
      }
    };

    const cls = classesByType(type);
    const actionItems =
      typeof (t.data as any)?.actionItems === "function" ? (t.data as any).actionItems() : (t.data as any)?.actionItems;

    return (
      <BaseToast.Root
        key={t.id}
        toast={t}
        className={cn(
          "[--toast-index:var(--toast-index)] relative group flex flex-col w-[350px] rounded-lg border shadow-custom-shadow-md p-2",
          "transition-all duration-300",
          "data-[starting-style]:opacity-0 data-[starting-style]:-translate-y-2",
          "data-[ending-style]:opacity-0 data-[ending-style]:translate-y-2",
          cls.bg,
          cls.border
        )}
      >
        {type === TOAST_TYPE.LOADING ? (
          <div className="flex items-center h-[98px] w-[350px]" data-prevent-outside-click>
            <div className={cn("w-full rounded-lg border shadow-sm p-2", cls.bg, cls.border)}>
              <div className="w-full h-full flex items-center justify-center px-4 py-2">
                {cls.icon && <div className="flex items-center justify-center">{cls.icon}</div>}
                <div className={cn("w-full flex items-center gap-0.5 pr-1", cls.icon ? "pl-4" : "pl-1", cls.text)}>
                  <div className={cn("grow text-sm font-semibold", cls.text)}>{t.title ?? "Loading..."}</div>
                  <div className="flex-shrink-0">
                    <BaseToast.Close
                      render={
                        <button
                          type="button"
                          aria-label="Close"
                          className="text-toast-text-secondary hover:text-toast-text-tertiary cursor-pointer"
                        >
                          <X strokeWidth={1.5} width={14} height={14} />
                        </button>
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div data-prevent-outside-click>
            <BaseToast.Close
              render={
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute top-2 right-2.5 text-toast-text-secondary hover:text-toast-text-tertiary cursor-pointer"
                >
                  <X strokeWidth={1.5} width={14} height={14} />
                </button>
              }
            />
            <div className="w-full flex flex-col gap-2 p-2">
              <div className="flex items-center w-full">
                {cls.icon && <div className="flex items-center justify-center">{cls.icon}</div>}
                <div className={cn("flex flex-col gap-0.5 pr-1", cls.icon ? "pl-4" : "pl-1")}>
                  <div className={cn("text-sm font-semibold", cls.text)}>{t.title}</div>
                  {t.description && (
                    <div className={cn("text-xs font-medium", "text-toast-text-secondary")}>{t.description}</div>
                  )}
                </div>
              </div>
              {actionItems && <div className="flex items-center pl-[32px]">{actionItems}</div>}
            </div>
          </div>
        )}
      </BaseToast.Root>
    );
  });
}

export const setToast = (props: SetToastProps) => {
  if (props.type === TOAST_TYPE.LOADING) {
    // Add loading toast (non-dismissable by timeout)
    const id = toastManager.add({
      title: props.title ?? "Loading...",
      type: TOAST_TYPE.LOADING,
      timeout: 0,
      data: {},
    });
    return id;
  }

  const { id, type, title, message, actionItems } = props as Exclude<SetToastProps, { type: TOAST_TYPE.LOADING }>;
  if (id !== undefined) {
    toastManager.update(String(id), {
      title,
      description: message,
      type,
      data: { actionItems },
    });
    return id;
  }

  return toastManager.add({
    title,
    description: message,
    type,
    data: { actionItems },
  });
};

export const setPromiseToast = <ToastData,>(
  promise: Promise<ToastData>,
  options: PromiseToastOptions<ToastData>
): void => {
  // create a loading toast and keep its id for subsequent updates
  const tId = setToast({ type: TOAST_TYPE.LOADING, title: options.loading });

  // also wire Base UI's promise helper to manage description lifecycle
  // using strings/functions per API for loading/success/error
  toastManager.promise(promise, {
    loading: options.loading ?? "Loading...",
    success: options.success.message ? (data: ToastData) => options.success.message!(data) : options.success.title,
    error: options.error.message ? (data: ToastData) => options.error.message!(data) : options.error.title,
  });

  // preserve title + action items behavior exactly like the existing API
  promise
    .then((data: ToastData) => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        id: tId,
        title: options.success.title,
        message: options.success.message?.(data),
        actionItems: options.success.actionItems?.(data),
      });
    })
    .catch((data: ToastData) => {
      setToast({
        type: TOAST_TYPE.ERROR,
        id: tId,
        title: options.error.title,
        message: options.error.message?.(data),
        actionItems: options.error.actionItems?.(data),
      });
    });
};
