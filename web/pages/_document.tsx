import Document, { Html, Head, Main, NextScript } from "next/document";
// constants
import Script from "next/script";
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  TWITTER_USER_NAME,
  SITE_KEYWORDS,
  SITE_TITLE,
} from "@/constants/seo-variables";

class MyDocument extends Document {
  render() {
    const isSessionRecorderEnabled = parseInt(process.env.NEXT_PUBLIC_ENABLE_SESSION_RECORDER || "0");

    return (
      <Html>
        <Head>
          <meta property="og:site_name" content={SITE_NAME} />
          <meta property="og:title" content={SITE_TITLE} />
          <meta property="og:url" content={SITE_URL} />
          <meta name="description" content={SITE_DESCRIPTION} />
          <meta property="og:description" content={SITE_DESCRIPTION} />
          <meta name="keywords" content={SITE_KEYWORDS} />
          <meta name="twitter:site" content={`@${TWITTER_USER_NAME}`} />
          <meta name="theme-color" content="#fff" />
          <link rel="apple-touch-icon" sizes="512x512" href="/plane-logos/plane-mobile-pwa.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest.json" />
          <link rel="shortcut icon" href="/favicon/favicon.ico" />
          {isSessionRecorderEnabled && process.env.NEXT_PUBLIC_SESSION_RECORDER_KEY && (
            <Script id="clarity-tracking">
              {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_SESSION_RECORDER_KEY}");`}
            </Script>
          )}
        </Head>
        <body>
          <div id="context-menu-portal" />
          <Main />
          <NextScript />
          {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
            <script
              defer
              data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
              src="https://plausible.io/js/script.js"
            />
          )}
        </body>
      </Html>
    );
  }
}

export default MyDocument;
