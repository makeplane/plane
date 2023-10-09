// @ts-check

/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  // https://www.i18next.com/overview/configuration-options#logging
  debug: process.env.NODE_ENV === "development",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
  },
  /** To avoid issues when deploying to some paas (vercel...) */
  localePath:
    typeof window === "undefined" ? require("path").resolve("./public/locales") : "/locales",
  react: { useSuspense: false },
  reloadOnPrerender: process.env.NODE_ENV === "development",
};
