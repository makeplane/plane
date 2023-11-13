export const getLocalStorage = (key: string) => {
  if (typeof window === undefined || typeof window === "undefined") return null;
  try {
    const item = window.localStorage.getItem(key);
    return item ? item : null;
  } catch (error) {
    window.localStorage.removeItem(key);
    return null;
  }
};

export const setLocalStorage = (key: string, value: any) => {
  if (key && value) {
    const _value = value ? (["string", "boolean"].includes(typeof value) ? value : JSON.stringify(value)) : null;
    if (_value) window.localStorage.setItem(key, _value);
  }
};

export const removeLocalStorage = (key: string) => {
  if (key) window.localStorage.removeItem(key);
};
