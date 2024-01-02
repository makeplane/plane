import isEmpty from "lodash/isEmpty";

export const storage = {
  set: (key: string, value: object | string | boolean): void => {
    if (typeof window === undefined || typeof window === "undefined" || !key || !value) return undefined;
    const _value: string | undefined = value
      ? ["string", "boolean"].includes(typeof value)
        ? value.toString()
        : isEmpty(value)
        ? undefined
        : JSON.stringify(value)
      : undefined;
    if (!_value) return undefined;
    window.localStorage.setItem(key, _value);
  },

  get: (key: string): string | undefined => {
    if (typeof window === undefined || typeof window === "undefined") return undefined;
    const item = window.localStorage.getItem(key);
    return item ? item : undefined;
  },

  remove: (key: string): void => {
    if (typeof window === undefined || typeof window === "undefined" || !key) return undefined;
    window.localStorage.removeItem(key);
  },
};
