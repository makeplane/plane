import { useContext } from "react";

import { themeContext } from "contexts/theme.context";

const useTheme = () => {
  const themeContextData = useContext(themeContext);

  return themeContextData;
};

export default useTheme;
