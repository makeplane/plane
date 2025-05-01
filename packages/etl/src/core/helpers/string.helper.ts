
export const stripTrailingSlash = (url: string): string => {
    return url.replace(/\/$/, "");
}