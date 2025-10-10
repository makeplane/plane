import * as React from "react";
import { Toast as BaseToast } from "@base-ui-components/react/toast";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
// spinner
import { CircularBarSpinner } from "../spinners/circular-bar-spinner";
import { cn } from "../utils/classname";

export enum TOAST_TYPE {
  SUCCESS = "success",
  ERROR = "error",
  INFO = "info",
  WARNING = "warning",
  LOADING = "loading",
  LOADING_TOAST = "loading-toast",
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

export type ToastProps = {
  theme: "light" | "dark" | "system";
};

const toastManager = BaseToast.createToastManager();

export const Toast = (props: ToastProps) => (
  <BaseToast.Provider toastManager={toastManager}>
    <BaseToast.Portal>
      <BaseToast.Viewport data-theme={props.theme}>
        <ToastList />
      </BaseToast.Viewport>
    </BaseToast.Portal>
  </BaseToast.Provider>
);

const TOAST_DATA = {
  [TOAST_TYPE.SUCCESS]: {
    icon: <CheckCircle2 width={24} height={24} strokeWidth={1.5} className="text-toast-text-success" />,
    textColorClassName: "text-toast-text-success",
    backgroundColorClassName: "bg-toast-background-success",
    borderColorClassName: "border-toast-border-success",
  },
  [TOAST_TYPE.ERROR]: {
    icon: <XCircle width={24} height={24} strokeWidth={1.5} className="text-toast-text-error" />,
    textColorClassName: "text-toast-text-error",
    backgroundColorClassName: "bg-toast-background-error",
    borderColorClassName: "border-toast-border-error",
  },
  [TOAST_TYPE.WARNING]: {
    icon: <AlertTriangle width={24} height={24} strokeWidth={1.5} className="text-toast-text-warning" />,
    textColorClassName: "text-toast-text-warning",
    backgroundColorClassName: "bg-toast-background-warning",
    borderColorClassName: "border-toast-border-warning",
  },
  [TOAST_TYPE.INFO]: {
    icon: <></>,
    textColorClassName: "text-toast-text-info",
    backgroundColorClassName: "bg-toast-background-info",
    borderColorClassName: "border-toast-border-info",
  },
  [TOAST_TYPE.LOADING]: {
    icon: <CircularBarSpinner className="text-toast-text-tertiary" />,
    textColorClassName: "text-toast-text-loading",
    backgroundColorClassName: "bg-toast-background-loading",
    borderColorClassName: "border-toast-border-loading",
  },
  [TOAST_TYPE.LOADING_TOAST]: {
    icon: <CircularBarSpinner className="text-toast-text-tertiary" />,
    textColorClassName: "text-toast-text-loading",
    backgroundColorClassName: "bg-toast-background-loading",
    borderColorClassName: "border-toast-border-loading",
  },
};
const ToastList = () => {
  const { toasts } = BaseToast.useToastManager();
  return toasts.map((toast) => <ToastRender key={toast.id} id={toast.id} toast={toast} />);
};

const ToastRender = ({ id, toast }: { id: React.Key; toast: BaseToast.Root.ToastObject }) => {
  const toastData = toast.data as SetToastProps;
  const type = toastData.type as TOAST_TYPE;
  const data = TOAST_DATA[type];

  return (
    <BaseToast.Root
      toast={toast}
      key={id}
      className={cn(
        // Base layout and positioning
        "flex group items-center rounded-lg border shadow-sm p-2 w-[350px]",
        "absolute right-3 bottom-3 z-[calc(1000-var(--toast-index))]",
        "select-none transition-[opacity,transform] duration-500 ease-&lsqb;cubic-bezier(0.22,1,0.36,1)&rsqb;",

        // Default transform with stacking and scaling
        "[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+calc(min(var(--toast-index),10)*-10px)))_scale(calc(max(0,1-(var(--toast-index)*0.1))))]",

        // Pseudo-element for gap spacing
        "after:absolute after:bottom-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",

        // State-based opacity
        "data-[ending-style]:opacity-0 data-[limited]:opacity-0",

        // Starting animation
        "data-[starting-style]:[transform:translateY(150%)]",

        // Expanded state transform
        "data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y)))]",

        // Swipe direction endings - consolidated
        "data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",

        // Default ending transform for non-limited toasts
        "data-[ending-style]:[&:not([data-limited])]:[transform:translateY(150%)]",

        data.backgroundColorClassName,
        data.borderColorClassName
      )}
      style={{
        ["--gap" as string]: "1rem",
        ["--offset-y" as string]:
          "calc(var(--toast-offset-y) * -1 + (var(--toast-index) * var(--gap) * -1) + var(--toast-swipe-movement-y))",
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {toastData.type === TOAST_TYPE.LOADING ? (
        <div className="w-full h-full flex items-center justify-center px-4 py-2">
          {data.icon && <div className="flex items-center justify-center">{data.icon}</div>}
          <div className={cn("w-full flex items-center gap-0.5 pr-1", data.icon ? "pl-4" : "pl-1")}>
            <div className={cn("grow text-sm font-semibold", data.textColorClassName)}>
              {toastData.title ?? "Loading..."}
            </div>
            <BaseToast.Close
              className="absolute top-2 right-2.5 text-toast-text-secondary hover:text-toast-text-tertiary cursor-pointer"
              aria-label="Close"
            >
              <X strokeWidth={1.5} width={14} height={14} />
            </BaseToast.Close>
          </div>
        </div>
      ) : (
        <>
          <BaseToast.Close className="absolute top-2 right-2.5 text-toast-text-secondary hover:text-toast-text-tertiary cursor-pointer">
            <X strokeWidth={1.5} width={14} height={14} />
          </BaseToast.Close>
          <div className="w-full flex flex-col gap-2 p-2">
            <div className="flex items-center w-full">
              {data.icon && <div className="flex items-center justify-center">{data.icon}</div>}
              <div className={cn("flex flex-col gap-0.5 pr-1", data.icon ? "pl-4" : "pl-1")}>
                <BaseToast.Title className={cn("text-sm font-semibold", data.textColorClassName)}>
                  {toastData.title}
                </BaseToast.Title>
                {toastData.message && (
                  <BaseToast.Description className="text-toast-text-secondary text-xs font-medium">
                    {toastData.message}
                  </BaseToast.Description>
                )}
              </div>
            </div>
            {toastData.actionItems && <div className="flex items-center pl-[32px]">{toastData.actionItems}</div>}
          </div>
        </>
      )}
    </BaseToast.Root>
  );
};

export const setToast = (props: SetToastProps) => {
  let toastId: string | undefined;
  if (props.type !== TOAST_TYPE.LOADING) {
    toastId = toastManager.add({
      data: {
        type: props.type,
        title: props.title,
        message: props.message,
        actionItems: props.actionItems,
      },
    });
  } else {
    toastId = toastManager.add({
      data: {
        type: props.type,
        title: props.title,
      },
    });
  }
  return toastId;
};

export const updateToast = (id: string, props: SetToastProps) => {
  toastManager.update(id, {
    data:
      props.type === TOAST_TYPE.LOADING
        ? {
            type: TOAST_TYPE.LOADING,
            title: props.title,
          }
        : {
            type: props.type,
            title: props.title,
            message: props.message,
            actionItems: props.actionItems,
          },
  });
};

export const setPromiseToast = <ToastData,>(
  promise: Promise<ToastData>,
  options: PromiseToastOptions<ToastData>
): void => {
  toastManager.promise(promise, {
    loading: {
      data: {
        title: options.loading ?? "Loading...",
        type: TOAST_TYPE.LOADING,
        message: undefined,
        actionItems: undefined,
      },
    },
    success: (data) => ({
      data: {
        type: TOAST_TYPE.SUCCESS,
        title: options.success.title,
        message: options.success.message?.(data),
        actionItems: options.success.actionItems?.(data),
      },
    }),
    error: (data) => ({
      data: {
        type: TOAST_TYPE.ERROR,
        title: options.error.title,
        message: options.error.message?.(data),
        actionItems: options.error.actionItems?.(data),
      },
    }),
  });
};

export const dismissToast = (tId: string) => {
  toastManager.close(tId);
};
