import { useState, useEffect, useCallback } from "react";

export const getValueFromLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window === undefined || typeof window === "undefined") return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    window.localStorage.removeItem(key);
    return defaultValue;
  }
};

export const setValueIntoLocalStorage = (key: string, value: any) => {
  if (typeof window === undefined || typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
};

// TODO: Remove this once we migrate to the new hooks from plane/helpers
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T | null>(() => getValueFromLocalStorage(key, initialValue));

  const setValue = useCallback(
    (value: T) => {
      window.localStorage.setItem(key, JSON.stringify(value));
      setStoredValue(value);
      window.dispatchEvent(new Event(`local-storage:${key}`));
    },
    [key]
  );

  const clearValue = useCallback(() => {
    window.localStorage.removeItem(key);
    setStoredValue(null);
    window.dispatchEvent(new Event(`local-storage:${key}`));
  }, [key]);

  const reHydrate = useCallback(() => {
    const data = getValueFromLocalStorage(key, initialValue);
    setStoredValue(data);
  }, [key, initialValue]);

  useEffect(() => {
    window.addEventListener(`local-storage:${key}`, reHydrate);
    return () => {
      window.removeEventListener(`local-storage:${key}`, reHydrate);
    };
  }, [key, reHydrate]);

  return { storedValue, setValue, clearValue } as const;
};

export default useLocalStorage;
