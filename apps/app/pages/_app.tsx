import "../styles/globals.css";
import "styles/editor.css";
import type { AppProps } from "next/app";

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
      <script defer data-domain="app.plane.so" src="https://plausible.io/js/script.js"></script>
    </>
  );
}

export default MyApp;
