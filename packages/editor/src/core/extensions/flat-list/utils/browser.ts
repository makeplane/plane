// Copied from https://github.com/prosemirror/prosemirror-view/blob/1.30.1/src/browser.ts

const nav = typeof navigator != 'undefined' ? navigator : null
const agent = (nav && nav.userAgent) || ''

const ie_edge = /Edge\/(\d+)/.exec(agent)
const ie_upto10 = /MSIE \d/.exec(agent)
const ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(agent)

const ie = !!(ie_upto10 || ie_11up || ie_edge)

export const safari = !ie && !!nav && /Apple Computer/.test(nav.vendor)
