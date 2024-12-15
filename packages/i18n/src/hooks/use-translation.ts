import { useState, useEffect } from "react";
import { translations, Language, fallbackLng, languages } from "../config";

export function useTranslation() {
  const [currentLocale, setCurrentLocale] = useState<Language>(fallbackLng);

  useEffect(() => {
    // Try to get language from localStorage
    const savedLocale = localStorage.getItem("userLanguage") as Language;
    if (savedLocale && languages.includes(savedLocale)) {
      setCurrentLocale(savedLocale);
    } else {
      // Get browser language
      const browserLang = navigator.language.split("-")[0] as Language;
      const newLocale = languages.includes(browserLang) ? browserLang : fallbackLng;
      localStorage.setItem("userLanguage", newLocale);
      setCurrentLocale(newLocale);
    }
  }, []);

  const t = (key: string) => {
    console.log("key", key);
    const translatedValue = translations[currentLocale]?.[key] || translations[fallbackLng][key] || key;
    console.log("translatedValue", translatedValue);
    return translatedValue;
  };

  const changeLanguage = (lng: Language) => {
    localStorage.setItem("userLanguage", lng);
    setCurrentLocale(lng);
  };

  return {
    t,
    currentLocale,
    changeLanguage,
    languages,
  };
}
