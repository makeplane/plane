import React, { createContext, useEffect } from "react";
import { observer } from "mobx-react";
import { TranslationStore } from "./store";
import { Language, languages } from "../config";

// Create the store instance
const translationStore = new TranslationStore();

// Create Context
export const TranslationContext = createContext<TranslationStore>(translationStore);

export const TranslationProvider = observer(({ children }: any) => {
  // Handle storage events for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "userLanguage" && event.newValue) {
        const newLang = event.newValue as Language;
        if (languages.includes(newLang)) {
          translationStore.setLanguage(newLang);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return <TranslationContext.Provider value={translationStore}>{children}</TranslationContext.Provider>;
});
