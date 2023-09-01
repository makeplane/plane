import Head from "next/head";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
// styles
import "styles/globals.css";
import "styles/editor.css";
// contexts
import { ToastContextProvider } from "contexts/toast.context";
// mobx store provider
import { MobxStoreProvider } from "lib/mobx/store-provider";
import MobxStoreInit from "lib/mobx/store-init";
// constants
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, TWITTER_USER_NAME, SITE_KEYWORDS, SITE_TITLE } from "constants/seo";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MobxStoreProvider>
      <MobxStoreInit />
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
      <ToastContextProvider>
        <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
          <Component {...pageProps} />
        </ThemeProvider>
      </ToastContextProvider>
    </MobxStoreProvider>
  );
}

export default MyApp;
