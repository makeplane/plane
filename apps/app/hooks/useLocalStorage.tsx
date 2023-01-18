import { useState, useEffect, useCallback } from "react";

// TODO: No Use of this
const useLocalStorage = <T,>(
  key: string,
  initialValue?: T extends Function ? never : T | (() => T)
) => {
  const [value, setValue] = useState<T | string>("");

  useEffect(() => {
    const data = window.localStorage.getItem(key);
    if (data !== null && data !== "undefined") setValue(JSON.parse(data));
    else setValue(typeof initialValue === "function" ? initialValue() : initialValue);
  }, [key, initialValue]);

  const updateState = useCallback(
    (value: T) => {
      if (!value) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(value));
      setValue(value);
      window.dispatchEvent(new Event(`local-storage-change-${key}`));
    },
    [key]
  );

  const reHydrateState = useCallback(() => {
    const data = window.localStorage.getItem(key);
    if (data !== null) setValue(JSON.parse(data));
  }, [key]);

  useEffect(() => {
    window.addEventListener(`local-storage-change-${key}`, reHydrateState);
    return () => window.removeEventListener(`local-storage-change-${key}`, reHydrateState);
  }, [reHydrateState, key]);

  return [value, updateState];
};

export default useLocalStorage;
