import { useContext } from "react";
// mobx store
import { UserContext } from "lib/user-provider";
// types
import { IUserStore } from "store/user.store";

const useUser = (): IUserStore => {
  const context = useContext(UserContext);
  if (context === undefined)
    throw new Error("useUser must be used within UserProvider");
  return context;
};

export default useUser;
