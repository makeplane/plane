import Head from "next/head";
import { useRouter } from "next/router";

import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  TWITTER_USER_NAME
} from "@constants/seo/seo-variables";

type Meta = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string | null;
};

type Props = {
  meta: Meta;
  children: React.ReactNode;
};

const PageSeo = ({ meta, children }: Props) => {
  const router = useRouter();
  const image = meta.image || "/site-image.png";
  const title = meta.title || SITE_NAME;
  const url = meta.url || `${SITE_URL}${router.asPath}`;
  const description = meta.description || SITE_DESCRIPTION;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:url" content={url} />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
        <meta name="twitter:site" content={`@${TWITTER_USER_NAME}`} />
        <meta
          name="twitter:card"
          content={image ? "summary_large_image" : "summary"}
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest.json" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /> */}
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {image && (
          <meta
            property="og:image"
            content={
              image.startsWith("https://") ? image : `${SITE_URL}${image}`
            }
          />
        )}
      </Head>
      {children}
    </>
  );
};

export default PageSeo;
