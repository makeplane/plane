import { useContext } from "react";

// context
import { UserContext } from "contexts/user.context";

const useUser = () => {
  // context
  const contextData = useContext(UserContext);

  return { ...contextData };
};

export default useUser;
