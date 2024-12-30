import { observer } from "mobx-react";
import React, { createContext, useEffect } from "react";
import { Language, languages } from "../config";
import { TranslationStore } from "./store";

// Create the store instance
const translationStore = new TranslationStore();

// Create Context
export const TranslationContext = createContext<TranslationStore>(translationStore);

export const TranslationProvider = observer(({ children }: { children: React.ReactNode }) => {
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
