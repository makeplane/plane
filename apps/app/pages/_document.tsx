import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    const isSessionRecorderEnabled = parseInt(
      process.env.NEXT_PUBLIC_ENABLE_SESSION_RECORDER || "0"
    );

    return (
      <Html>
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icon.png" />
          <meta name="theme-color" content="#fff" />
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
          <script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" />
          {isSessionRecorderEnabled && process.env.NEXT_PUBLIC_SESSION_RECORDER_KEY && (
            <script
              defer
              dangerouslySetInnerHTML={{
                __html: `(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_SESSION_RECORDER_KEY}");`,
              }}
            />
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
