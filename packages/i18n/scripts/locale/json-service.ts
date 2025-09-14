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
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        Object.assign(result, this.flatten(value as NestedTranslations, newKey));
      } else {
        result[newKey] = value === "" ? "" : (value as string);
      }
    }

    return result;
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
