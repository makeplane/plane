// styles
import "styles/globals.css";
import "styles/editor.css";
import "styles/nprogress.css";

// router
import Router from "next/router";

// nprogress
import NProgress from "nprogress";

// contexts
import { UserProvider } from "contexts/user.context";
import { ToastContextProvider } from "contexts/toast.context";
import { ThemeContextProvider } from "contexts/theme.context";
// types
import type { AppProps } from "next/app";

// nprogress
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", NProgress.start);
Router.events.on("routeChangeError", NProgress.done);
Router.events.on("routeChangeComplete", NProgress.done);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ToastContextProvider>
        <ThemeContextProvider>
          <Component {...pageProps} />
        </ThemeContextProvider>
      </ToastContextProvider>
    </UserProvider>
  );
}

export default MyApp;
