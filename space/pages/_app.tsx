import type { AppProps } from "next/app";
import Head from "next/head";
import { ThemeProvider } from "next-themes";
// styles
import "@/styles/globals.css";
// contexts
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, TWITTER_USER_NAME, SITE_KEYWORDS, SITE_TITLE } from "@/constants/seo";
import { ToastContextProvider } from "@/contexts/toast.context";
// mobx store provider
import InstanceLayout from "@/layouts/instance-layout";
import { MobxStoreProvider } from "@/lib/mobx/store-provider";
// constants

const prefix = parseInt(process.env.NEXT_PUBLIC_DEPLOY_WITH_NGINX || "0") === 0 ? "/" : "/spaces/";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MobxStoreProvider>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:url" content={SITE_URL} />
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta name="keywords" content={SITE_KEYWORDS} />
        <meta name="twitter:site" content={`@${TWITTER_USER_NAME}`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`${prefix}favicon/apple-touch-icon.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${prefix}favicon/favicon-32x32.png`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${prefix}favicon/favicon-16x16.png`} />
        <link rel="manifest" href={`${prefix}site.webmanifest.json`} />
        <link rel="shortcut icon" href={`${prefix}favicon/favicon.ico`} />
      </Head>
      <ToastContextProvider>
        <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
          <InstanceLayout>
            <Component {...pageProps} />
          </InstanceLayout>
        </ThemeProvider>
      </ToastContextProvider>
    </MobxStoreProvider>
  );
}

export default MyApp;
