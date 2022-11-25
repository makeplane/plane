import { UserProvider } from "./user.context";
import { ToastContextProvider } from "./toast.context";
import { ThemeContextProvider } from "./theme.context";

const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProvider>
      <ToastContextProvider>
        <ThemeContextProvider>{children}</ThemeContextProvider>
      </ToastContextProvider>
    </UserProvider>
  );
};

export default GlobalContextProvider;
