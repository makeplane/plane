// TODO: localized should be an observable to re-render the component when the locale changes without having to reload the page
// TODO: move locale from localstorage to database (?)

import { LOCALES } from "constants/locales";

export const localized = (key: string, localizationDataset: any = null): string => {
  try {
    if (!localizationDataset) {
      const locale = getLocale();
      localizationDataset = require(`public/locales/${locale}.json`);
    }

    return localizationDataset && localizationDataset[key] ? localizationDataset[key] : key;
  } catch (e) {
    return key;
  }
};

export const getAutoLocale = (): string => {
  const locale = navigator.language;
  const mostSimilarLocale = findMostSimilarLocale(locale);
  return mostSimilarLocale;
};

export const getLocale = () => {
  try {
    return localStorage.getItem("locale") || "en_US";
  } catch (e) {
    return "en_US";
  }
};
export const setLocale = (locale: string): void => {
  try {
    localStorage.setItem("locale", locale);
  } catch (e) {}
};

const findMostSimilarLocale = (locale: string): string => {
  const similarities = LOCALES.map((l) => similar(locale, l.value));
  const min = Math.min(...similarities);

  if (min > 3) {
    return "en_US";
  }

  const index = similarities.indexOf(min);
  return LOCALES[index].value;
};

const similar = (str1: string, str2: string): number => {
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();

  let distance = levenshteinDistance(str1, str2);
  if (str1.includes(str2)) {
    distance -= 1;
  }

  return distance;
};

const levenshteinDistance = (str1: string, str2: string) => {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return track[str2.length][str1.length];
};
