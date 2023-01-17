import type { AppProps } from "next/app";
// styles
import "styles/globals.css";
import "styles/editor.css";
// context
import { UserProvider } from "contexts/user.context";
import { ToastContextProvider } from "contexts/toast.context";
import { ThemeContextProvider } from "contexts/theme.context";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <UserProvider>
        <ToastContextProvider>
          <ThemeContextProvider>
            <Component {...pageProps} />
          </ThemeContextProvider>
        </ToastContextProvider>
      </UserProvider>
    </>
  );
}

export default MyApp;
