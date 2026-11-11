/**
 * Tailwind config loaded with `@config` in globals.css. It only adjusts the
 * `@tailwindcss/typography` (`prose`) styles.
 *
 * The plugin resets `margin-top` with `hr + *`, `h2 + *`, `h3 + *` and `h4 + *`.
 * A universal selector after a sibling combinator makes Chromium restyle all
 * following siblings on every DOM insert, which slows down large lists and
 * tables. We remove those rules and apply the same reset to the block elements
 * that get a top margin inside `prose`.
 */
const followingBlock =
  ":is(p, blockquote, ul, ol, dl, pre, table, img, video, hr, h2, h3, h4, .editor-callout-component)";

export default {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            "hr + *": null,
            "h2 + *": null,
            "h3 + *": null,
            "h4 + *": null,
            [`:is(hr, h2, h3, h4) + ${followingBlock}`]: {
              marginTop: "0",
            },
          },
        },
      },
    },
  },
};
