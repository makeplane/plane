import _ from "lodash";

export interface NestedTranslations {
  [key: string]: string | NestedTranslations;
}

export class JsonService {
  /**
   * Flattens a nested translations object into a flat key-value structure
   * @param obj The nested translations object to flatten
   * @param prefix Optional prefix for nested keys
   * @returns A flattened object with dot-notation keys
   */
  flatten(obj: NestedTranslations, prefix = ""): Record<string, string> {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (_.isPlainObject(obj[key])) {
          Object.assign(acc, this.flatten(obj[key] as NestedTranslations, newKey));
        } else {
          // Handle empty strings explicitly
          acc[newKey] = obj[key] === "" ? "" : (obj[key] as string);
        }
        return acc;
      },
      {} as Record<string, string>
    );
  }

  /**
   * Sets a value at a specific path in the translations object
   * @param obj The translations object to modify
   * @param key The dot-notation path where to set the value
   * @param value The translation string to set
   * @returns The modified translations object
   */
  set(obj: NestedTranslations, key: string, value: string): NestedTranslations {
    _.set(obj, key, value);
    return obj;
  }

  /**
   * Removes a value at a specific path in the translations object
   * @param obj The translations object to modify
   * @param key The dot-notation path to remove
   * @returns The modified translations object
   */
  unset(obj: NestedTranslations, key: string): NestedTranslations {
    _.unset(obj, key);
    return obj;
  }
}
