export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
// PI Base Url
export const PI_BASE_URL = process.env.NEXT_PUBLIC_PI_BASE_URL || "";
// God Mode Admin App Base Url
export const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL || "";
export const ADMIN_BASE_PATH = process.env.NEXT_PUBLIC_ADMIN_BASE_PATH || "";
export const GOD_MODE_URL = encodeURI(`${ADMIN_BASE_URL}${ADMIN_BASE_PATH}/`);
// Publish App Base Url
export const SPACE_BASE_URL = process.env.NEXT_PUBLIC_SPACE_BASE_URL || "";
export const SPACE_BASE_PATH = process.env.NEXT_PUBLIC_SPACE_BASE_PATH || "";
export const SITES_URL = encodeURI(`${SPACE_BASE_URL}${SPACE_BASE_PATH}/`);
// Live App Base Url
export const LIVE_BASE_URL = process.env.NEXT_PUBLIC_LIVE_BASE_URL || "";
export const LIVE_BASE_PATH = process.env.NEXT_PUBLIC_LIVE_BASE_PATH || "";
export const LIVE_URL = encodeURI(`${LIVE_BASE_URL}${LIVE_BASE_PATH}/`);
// plane website url
export const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "https://plane.so";
