import { useContext } from "react";
// mobx store
import { InstanceContext } from "lib/instance-provider";
// types
import { IInstanceStore } from "store/instance.store";

export const useInstance = (): IInstanceStore => {
  const context = useContext(InstanceContext);
  if (context === undefined) throw new Error("useInstance must be used within InstanceProvider");
  return context;
};
