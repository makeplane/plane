import { useContext } from "react";
import { toastContext } from "contexts/toast.context";

const useToast = () => {
  const toastContextData = useContext(toastContext);
  return toastContextData;
};

export default useToast;
