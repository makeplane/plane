import React, { useEffect, useState } from "react";

const getSavedValue = (key: any, value: any) => {
  const savedValue = localStorage.getItem(key);
  if (savedValue) {
    return savedValue;
  }
  return value;
};

const useLocalStorage = (key: any, value: any) => {
  const [updatedvalue, seUpdatedvalue] = useState(() => getSavedValue(key, value));

  useEffect(() => {
    localStorage.setItem(key, updatedvalue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedvalue]);

  return [updatedvalue, seUpdatedvalue];
};

export default useLocalStorage;
