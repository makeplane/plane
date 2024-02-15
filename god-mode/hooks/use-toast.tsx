import { useContext } from "react";
import { toastContext } from "lib/toast-provider";

const useToast = () => {
  const toastContextData = useContext(toastContext);
  return toastContextData;
};

export default useToast;