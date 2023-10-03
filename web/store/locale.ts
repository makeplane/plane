// mobx
import { localized, setLocale, getAutoLocale, setAutoLocale } from "helpers/localization.helper";
import { action, makeObservable, observable } from "mobx";

class LocaleStore {
  locale: string | null = null;
  localizedData: any = null;

  // root store
  rootStore;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      locale: observable,
      setLocale: action,
      localized: observable,
    });

    this.rootStore = _rootStore;
    this.initialLoad();
  }

  setLocale(locale: string) {
    if (locale === "auto") {
      locale = getAutoLocale();
    }

    setLocale(locale);
    this.locale = locale;
    this.localizedData = require(`public/locales/${locale}.json`);
  }

  setAutoLocale() {
    return setAutoLocale(this.rootStore);
  }

  localized(key: string) {
    return localized(key, this.localizedData);
  }

  initialLoad() {}
}

export default LocaleStore;
