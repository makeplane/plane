import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-provider";
// stores
import { IIntakeStore } from "@/plane-web/store/intake.store";

export const useIntake = (): IIntakeStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useIntake must be used within StoreProvider");
  return context.intakeStore;
};
