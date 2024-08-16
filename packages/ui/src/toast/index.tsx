import * as React from "react";
import { Toaster, toast } from "sonner";
// icons
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
// spinner
import { CircularBarSpinner } from "../spinners";
// helper
import { cn } from "../../helpers";

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
type ActionItemsPromiseToastCallback<ToastData> = (data: ToastData) => JSX.Element;

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

type ToastContentProps = {
  toastId: string | number;
  icon?: React.ReactNode;
  textColorClassName: string;
  backgroundColorClassName: string;
  borderColorClassName: string;
};

type ToastProps = {
  theme: "light" | "dark" | "system";
};

export const Toast = (props: ToastProps) => {
  const { theme } = props;
  return <Toaster visibleToasts={5} gap={16} theme={theme} />;
};

export const setToast = (props: SetToastProps) => {
  const renderToastContent = ({
    toastId,
    icon,
    textColorClassName,
    backgroundColorClassName,
    borderColorClassName,
  }: ToastContentProps) =>
    props.type === TOAST_TYPE.LOADING ? (
      <div className="flex items-center h-[98px] w-[350px]" data-prevent-outside-click>
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={cn("w-full rounded-lg border shadow-sm p-2", backgroundColorClassName, borderColorClassName)}
        >
          <div className="w-full h-full flex items-center justify-center px-4 py-2">
            {icon && <div className="flex items-center justify-center">{icon}</div>}
            <div className={cn("w-full flex items-center gap-0.5 pr-1", icon ? "pl-4" : "pl-1")}>
              <div className={cn("grow text-sm font-semibold", textColorClassName)}>{props.title ?? "Loading..."}</div>
              <div className="flex-shrink-0">
                <X
                  className="text-toast-text-secondary hover:text-toast-text-tertiary cursor-pointer"
                  strokeWidth={1.5}
                  width={14}
                  height={14}
                  onClick={() => toast.dismiss(toastId)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div
        data-prevent-outside-click
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className={cn(
          "relative group flex flex-col w-[350px] rounded-lg border shadow-sm p-2",
          backgroundColorClassName,
          borderColorClassName
        )}
      >
        <X
          className="fixed top-2 right-2.5 text-toast-text-secondary hover:text-toast-text-tertiary cursor-pointer"
          strokeWidth={1.5}
          width={14}
          height={14}
          onClick={() => toast.dismiss(toastId)}
        />
        <div className="w-full flex flex-col gap-2 p-2">
          <div className="flex items-center w-full">
            {icon && <div className="flex items-center justify-center">{icon}</div>}
            <div className={cn("flex flex-col gap-0.5 pr-1", icon ? "pl-4" : "pl-1")}>
              <div className={cn("text-sm font-semibold", textColorClassName)}>{props.title}</div>
              {props.message && <div className="text-toast-text-secondary text-xs font-medium">{props.message}</div>}
            </div>
          </div>
          {props.actionItems && <div className="flex items-center pl-[32px]">{props.actionItems}</div>}
        </div>
      </div>
    );

  switch (props.type) {
    case TOAST_TYPE.SUCCESS:
      return toast.custom(
        (toastId) =>
          renderToastContent({
            toastId,
            icon: <CheckCircle2 width={24} height={24} strokeWidth={1.5} className="text-toast-text-success" />,
            textColorClassName: "text-toast-text-success",
            backgroundColorClassName: "bg-toast-background-success",
            borderColorClassName: "border-toast-border-success",
          }),
        props.id ? { id: props.id } : {}
      );
    case TOAST_TYPE.ERROR:
      return toast.custom(
        (toastId) =>
          renderToastContent({
            toastId,
            icon: <XCircle width={24} height={24} strokeWidth={1.5} className="text-toast-text-error" />,
            textColorClassName: "text-toast-text-error",
            backgroundColorClassName: "bg-toast-background-error",
            borderColorClassName: "border-toast-border-error",
          }),
        props.id ? { id: props.id } : {}
      );
    case TOAST_TYPE.WARNING:
      return toast.custom(
        (toastId) =>
          renderToastContent({
            toastId,
            icon: <AlertTriangle width={24} height={24} strokeWidth={1.5} className="text-toast-text-warning" />,
            textColorClassName: "text-toast-text-warning",
            backgroundColorClassName: "bg-toast-background-warning",
            borderColorClassName: "border-toast-border-warning",
          }),
        props.id ? { id: props.id } : {}
      );
    case TOAST_TYPE.INFO:
      return toast.custom(
        (toastId) =>
          renderToastContent({
            toastId,
            textColorClassName: "text-toast-text-info",
            backgroundColorClassName: "bg-toast-background-info",
            borderColorClassName: "border-toast-border-info",
          }),
        props.id ? { id: props.id } : {}
      );

    case TOAST_TYPE.LOADING:
      return toast.custom((toastId) =>
        renderToastContent({
          toastId,
          icon: <CircularBarSpinner className="text-toast-text-tertiary" />,
          textColorClassName: "text-toast-text-loading",
          backgroundColorClassName: "bg-toast-background-loading",
          borderColorClassName: "border-toast-border-loading",
        })
      );
  }
};

export const setPromiseToast = <ToastData,>(
  promise: Promise<ToastData>,
  options: PromiseToastOptions<ToastData>
): void => {
  const tId = setToast({ type: TOAST_TYPE.LOADING, title: options.loading });

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
