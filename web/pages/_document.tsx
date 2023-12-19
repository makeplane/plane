import Document, { Html, Head, Main, NextScript } from "next/document";
// constants
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  TWITTER_USER_NAME,
  SITE_KEYWORDS,
  SITE_TITLE,
} from "constants/seo-variables";
import Script from "next/script";

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
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
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
          <Main />
          <NextScript />
          {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
            <script
              defer
              data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
              src="https://plausible.io/js/script.js"
            />
          )}
          {process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST && (
            <Script id="posthog-tracking">
              {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('${process.env.NEXT_PUBLIC_POSTHOG_KEY}',{api_host:'${process.env.NEXT_PUBLIC_POSTHOG_HOST}'})`}
            </Script>
          )}
        </body>
      </Html>
    );
  }
}

export default MyDocument;
