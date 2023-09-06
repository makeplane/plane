// next imports
import Head from "next/head";
import dynamic from "next/dynamic";
import Router from "next/router";
import App, { AppContext, AppProps } from 'next/app'

// themes
import { ThemeProvider } from "next-themes";

// styles
import "styles/globals.css";
import "styles/editor.css";
import "styles/command-pallette.css";
import "styles/nprogress.css";
import "styles/react-datepicker.css";

// nprogress
import NProgress from "nprogress";

// contexts
import { UserProvider } from "contexts/user.context";
import { ToastContextProvider } from "contexts/toast.context";
import { ThemeContextProvider } from "contexts/theme.context";
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
// mobx store provider
import { MobxStoreProvider } from "lib/mobx/store-provider";
import MobxStoreInit from "lib/mobx/store-init";

const CrispWithNoSSR = dynamic(() => import("constants/crisp"), { ssr: false });

// nprogress
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", NProgress.start);
Router.events.on("routeChangeError", NProgress.done);
Router.events.on("routeChangeComplete", NProgress.done);

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext)

  return { ...appProps }
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // <UserProvider>
    // mobx root provider
    <MobxStoreProvider {...pageProps}>
      <ThemeProvider themes={THEMES} defaultTheme="system">
        <ToastContextProvider>
          <CrispWithNoSSR />
          <Head>
            <title>{SITE_TITLE}</title>
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={SITE_TITLE} />
            <meta property="og:url" content={SITE_URL} />
            <meta name="description" content={SITE_DESCRIPTION} />
            <meta property="og:description" content={SITE_DESCRIPTION} />
            <meta name="keywords" content={SITE_KEYWORDS} />
            <meta name="twitter:site" content={`@${TWITTER_USER_NAME}`} />
            <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
            <link rel="manifest" href="/site.webmanifest.json" />
            <link rel="shortcut icon" href="/favicon/favicon.ico" />
          </Head>
          <MobxStoreInit />
          <Component {...pageProps} />
        </ToastContextProvider>
      </ThemeProvider>
    </MobxStoreProvider>
    // </UserProvider>
  );
}

export default MyApp;
