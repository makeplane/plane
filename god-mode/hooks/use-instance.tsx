import { useContext } from "react";
// mobx store
import { InstanceContext } from "lib/instance-provider";
// types
import { IInstanceStore } from "store/instance.store";

const useInstance = (): IInstanceStore => {
  const context = useContext(InstanceContext);
  if (context === undefined)
    throw new Error("useInstance must be used within InstanceProvider");
  return context;
};

export default useInstance;
