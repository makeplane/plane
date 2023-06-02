import dynamic from "next/dynamic";

// themes
import { ThemeProvider } from "next-themes";

// styles
import "styles/globals.css";
import "styles/editor.css";
import "styles/command-pallette.css";
import "styles/nprogress.css";
import "styles/react-datepicker.css";

import Router from "next/router";
import Head from "next/head";

// nprogress
import NProgress from "nprogress";

// contexts
import { UserProvider } from "contexts/user.context";
import { ToastContextProvider } from "contexts/toast.context";
import { ThemeContextProvider } from "contexts/theme.context";
// types
import type { AppProps } from "next/app";
// constants
import { THEMES } from "constants/themes";
// constants
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  TWITTER_USER_NAME,
  SITE_KEYWORDS,
  SITE_TITLE,
} from "constants/seo-variables";

const CrispWithNoSSR = dynamic(() => import("constants/crisp"), { ssr: false });

// nprogress
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", NProgress.start);
Router.events.on("routeChangeError", NProgress.done);
Router.events.on("routeChangeComplete", NProgress.done);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // <UserProvider>
    <ThemeProvider themes={THEMES} defaultTheme="light">
      <ToastContextProvider>
        <ThemeContextProvider>
          <CrispWithNoSSR />
          <Component {...pageProps} />
        </ThemeContextProvider>
      </ToastContextProvider>
    </ThemeProvider>
    // </UserProvider>
  );
}

export default MyApp;
