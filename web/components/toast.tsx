import { Toaster, toast } from "sonner";

export const Toast = () => {
  return <Toaster expand={false} richColors visibleToasts={5} />;
};

export enum TOAST_TYPE {
  SUCCESS,
  ERROR,
  INFO,
  WARNING,
  LOADING,
}

type toastProps =
  | {
      type: TOAST_TYPE.LOADING;
    }
  | {
      type: Exclude<TOAST_TYPE, TOAST_TYPE.LOADING>;
      title: string;
      message: string;
    };

export const setToast = (props: toastProps) => {
  switch (props.type) {
    case TOAST_TYPE.SUCCESS:
      return toast.custom((t) => (
        <div className="h-[70px] w-[300px]" style={{ backgroundColor: "green" }}>
          <h1>title</h1>
          <button onClick={() => toast.dismiss(t)}>Dismiss</button>
        </div>
      ));
  }
};
