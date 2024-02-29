import { Toaster, toast } from "sonner";
// icons
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
// components
import { ToastSpinner } from "./spinner";

export const Toast = () => <Toaster visibleToasts={5} gap={28} />;

export enum TOAST_TYPE {
  SUCCESS = "success",
  ERROR = "error",
  INFO = "info",
  WARNING = "warning",
  LOADING = "loading",
}

type ToastProps =
  | {
      type: TOAST_TYPE.LOADING;
      title?: string;
    }
  | {
      id?: string | number;
      type: Exclude<TOAST_TYPE, TOAST_TYPE.LOADING>;
      title: string;
      message?: string;
    };

type ToastContentProps = {
  toastId: string | number;
  icon?: React.ReactNode;
  textColorClassName: string;
  borderColorClassName: string;
};

// TODO: Update colors as per theme.
export const setToast = (props: ToastProps) => {
  const renderToastContent = ({ toastId, icon, textColorClassName, borderColorClassName }: ToastContentProps) =>
    props.type === TOAST_TYPE.LOADING ? (
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className={`w-[350px] bg-white rounded-lg border ${borderColorClassName} shadow-sm p-2`}
      >
        <div className="w-full flex items-center px-4 py-2">
          {icon && <div className="flex items-center justify-center">{icon}</div>}
          <div className={`w-full flex items-center gap-0.5 pr-1 ${icon ? "pl-4" : "pl-1"}`}>
            <div className={`grow ${textColorClassName} text-sm font-semibold`}>{props.title ?? "Loading..."}</div>
            <div className="flex-shrink-0">
              <X
                className="text-gray-500 cursor-pointer"
                strokeWidth={1.5}
                width={14}
                height={14}
                onClick={() => toast.dismiss(toastId)}
              />
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className={`relative flex flex-col w-[350px] bg-white rounded-lg border ${borderColorClassName} shadow-sm p-2`}
      >
        <X
          className="fixed top-2 right-2.5 text-gray-500 cursor-pointer"
          strokeWidth={1.5}
          width={14}
          height={14}
          onClick={() => toast.dismiss(toastId)}
        />
        <div className="w-full flex items-center px-4 py-2">
          {icon && <div className="flex items-center justify-center">{icon}</div>}
          <div className={`flex flex-col gap-0.5 pr-1 ${icon ? "pl-6" : "pl-1"}`}>
            <div className={`${textColorClassName} text-sm font-semibold`}>{props.title}</div>
            {props.message && <div className="text-gray-500 text-xs font-medium">{props.message}</div>}
          </div>
        </div>
      </div>
    );

  switch (props.type) {
    case TOAST_TYPE.SUCCESS:
      return toast.custom(
        (toastId) =>
          renderToastContent({
            toastId,
            icon: <CheckCircle2 width={28} height={28} strokeWidth={1.5} className="text-green-600" />,
            textColorClassName: "text-green-600",
            borderColorClassName: "border-green-100",
          }),
        props.id ? { id: props.id } : {}
      );
    case TOAST_TYPE.ERROR:
      return toast.custom(
        (toastId) =>
          renderToastContent({
            toastId,
            icon: <XCircle width={28} height={28} strokeWidth={1.5} className="text-red-500" />,
            textColorClassName: "text-red-500",
            borderColorClassName: "border-red-100",
          }),
        props.id ? { id: props.id } : {}
      );
    case TOAST_TYPE.WARNING:
      return toast.custom(
        (toastId) =>
          renderToastContent({
            toastId,
            icon: <AlertTriangle width={28} height={28} strokeWidth={1.5} className="text-yellow-400" />,
            textColorClassName: "text-yellow-400",
            borderColorClassName: "border-yellow-100",
          }),
        props.id ? { id: props.id } : {}
      );
    case TOAST_TYPE.INFO:
      return toast.custom(
        (toastId) =>
          renderToastContent({
            toastId,
            textColorClassName: "text-indigo-600",
            borderColorClassName: "border-indigo-100",
          }),
        props.id ? { id: props.id } : {}
      );

    case TOAST_TYPE.LOADING:
      return toast.custom((toastId) =>
        // TODO: Add loader
        renderToastContent({
          toastId,
          icon: <ToastSpinner className="text-gray-500" />,
          textColorClassName: "text-black",
          borderColorClassName: "border-gray-200 ",
        })
      );
  }
};

type PromiseToastCallback<ToastData> = (data: ToastData) => string;

type PromiseToastData<ToastData> = {
  title: string;
  message?: PromiseToastCallback<ToastData>;
};

type PromiseToastOptions<ToastData> = {
  loading?: string;
  success: PromiseToastData<ToastData>;
  error: PromiseToastData<ToastData>;
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
      });
    })
    .catch((data: ToastData) => {
      setToast({
        type: TOAST_TYPE.ERROR,
        id: tId,
        title: options.error.title,
        message: options.error.message?.(data),
      });
    });
};
