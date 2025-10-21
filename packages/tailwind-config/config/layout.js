/**
 * Layout utilities configuration for Tailwind CSS
 * Includes z-index hierarchy, breakpoints, and custom heights
 */

module.exports = {
  // Z-index layering system
  zIndex: {
    base: 0 /* default content */,
    header: 10 /* sticky headers, navbars */,
    sidebar: 20 /* sidebars, drawers */,
    dropdown: 30 /* dropdowns, select menus */,
    popover: 40 /* popovers, hovercards */,
    tooltip: 50 /* tooltips, hints */,
    sticky: 60 /* sticky UI */,
    backdrop: 90 /* backdrop / overlay */,
    modal: 100 /* dialogs, modals */,
    toast: 110 /* toast, alerts */,
    loader: 120 /* blocking loader/spinner */,
    max: 9999 /* emergency override (rare use) */,
  },

  // Custom screen breakpoints
  screens: {
    "3xl": "1792px",
  },

  // Custom heights
  height: {
    header: "3.25rem",
  },
};
