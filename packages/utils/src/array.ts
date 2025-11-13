import { isEmpty } from "lodash-es";
import type { IIssueLabel, IIssueLabelTree } from "@plane/types";

/**
 * @description Groups an array of objects by a specified key
 * @param {any[]} array Array to group
 * @param {string} key Key to group by (supports dot notation for nested objects)
 * @returns {Object} Grouped object with keys being the grouped values
 * @example
 * const array = [{type: 'A', value: 1}, {type: 'B', value: 2}, {type: 'A', value: 3}];
 * groupBy(array, 'type') // returns { A: [{type: 'A', value: 1}, {type: 'A', value: 3}], B: [{type: 'B', value: 2}] }
 */
export const groupBy = (array: any[], key: string) => {
  const innerKey = key.split("."); // split the key by dot
  return array.reduce((result, currentValue) => {
    const key = innerKey.reduce((obj, i) => obj?.[i], currentValue) ?? "None"; // get the value of the inner key
    (result[key] = result[key] || []).push(currentValue);
    return result;
  }, {});
};

/**
 * @description Orders an array by a specified key in ascending or descending order
 * @param {any[]} orgArray Original array to order
 * @param {string} key Key to order by (supports dot notation for nested objects)
 * @param {"ascending" | "descending"} ordering Sort order
 * @returns {any[]} Ordered array
 * @example
 * const array = [{value: 2}, {value: 1}, {value: 3}];
 * orderArrayBy(array, 'value', 'ascending') // returns [{value: 1}, {value: 2}, {value: 3}]
 */
export const orderArrayBy = (orgArray: any[], key: string, ordering: "ascending" | "descending" = "ascending") => {
  if (!orgArray || !Array.isArray(orgArray) || orgArray.length === 0) return [];

  const array = [...orgArray];

  if (key[0] === "-") {
    ordering = "descending";
    key = key.slice(1);
  }

  const innerKey = key.split("."); // split the key by dot

  return array.sort((a, b) => {
    const keyA = innerKey.reduce((obj, i) => obj[i], a); // get the value of the inner key
    const keyB = innerKey.reduce((obj, i) => obj[i], b); // get the value of the inner key
    if (keyA < keyB) {
      return ordering === "ascending" ? -1 : 1;
    }
    if (keyA > keyB) {
      return ordering === "ascending" ? 1 : -1;
    }
    return 0;
  });
};

/**
 * @description Checks if an array contains duplicate values
 * @param {any[]} array Array to check for duplicates
 * @returns {boolean} True if duplicates exist, false otherwise
 * @example
 * checkDuplicates([1, 2, 2, 3]) // returns true
 * checkDuplicates([1, 2, 3]) // returns false
 */
export const checkDuplicates = (array: any[]) => new Set(array).size !== array.length;

/**
 * @description Finds the string with the most characters in an array of strings
 * @param {string[]} strings Array of strings to check
 * @returns {string} String with the most characters
 * @example
 * findStringWithMostCharacters(['a', 'bb', 'ccc']) // returns 'ccc'
 */
export const findStringWithMostCharacters = (strings: string[]): string => {
  if (!strings || strings.length === 0) return "";

  return strings.reduce((longestString, currentString) =>
    currentString.length > longestString.length ? currentString : longestString
  );
};

/**
 * @description Checks if two arrays have the same elements regardless of order
 * @param {any[] | null} arr1 First array
 * @param {any[] | null} arr2 Second array
 * @returns {boolean} True if arrays have same elements, false otherwise
 * @example
 * checkIfArraysHaveSameElements([1, 2], [2, 1]) // returns true
 * checkIfArraysHaveSameElements([1, 2], [1, 3]) // returns false
 */
export const checkIfArraysHaveSameElements = (arr1: any[] | null, arr2: any[] | null): boolean => {
  if (!arr1 || !arr2) return false;
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length === 0 && arr2.length === 0) return true;

  return arr1.length === arr2.length && arr1.every((e) => arr2.includes(e));
};

type GroupedItems<T> = { [key: string]: T[] };

/**
 * @description Groups an array of objects by a specified field
 * @param {T[]} array Array to group
 * @param {keyof T} field Field to group by
 * @returns {GroupedItems<T>} Grouped object
 * @example
 * const array = [{type: 'A', value: 1}, {type: 'B', value: 2}];
 * groupByField(array, 'type') // returns { A: [{type: 'A', value: 1}], B: [{type: 'B', value: 2}] }
 */
export const groupByField = <T>(array: T[], field: keyof T): GroupedItems<T> =>
  array.reduce((grouped: GroupedItems<T>, item: T) => {
    const key = String(item[field]);
    grouped[key] = (grouped[key] || []).concat(item);
    return grouped;
  }, {});

/**
 * @description Sorts an array of objects by a specified field
 * @param {any[]} array Array to sort
 * @param {string} field Field to sort by
 * @returns {any[]} Sorted array
 * @example
 * const array = [{value: 2}, {value: 1}];
 * sortByField(array, 'value') // returns [{value: 1}, {value: 2}]
 */
export const sortByField = (array: any[], field: string): any[] =>
  array.sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0));

/**
 * @description Orders grouped data by a specified field
 * @param {GroupedItems<T>} groupedData Grouped data object
 * @param {keyof T} orderBy Field to order by
 * @returns {GroupedItems<T>} Ordered grouped data
 */
export const orderGroupedDataByField = <T>(groupedData: GroupedItems<T>, orderBy: keyof T): GroupedItems<T> => {
  for (const key in groupedData) {
    if (groupedData.hasOwnProperty(key)) {
      groupedData[key] = groupedData[key].sort((a, b) => {
        if (a[orderBy] < b[orderBy]) return -1;
        if (a[orderBy] > b[orderBy]) return 1;
        return 0;
      });
    }
  }
  return groupedData;
};

/**
 * @description Builds a tree structure from an array of labels
 * @param {IIssueLabel[]} array Array of labels
 * @param {any} parent Parent ID
 * @returns {IIssueLabelTree[]} Tree structure
 */
export const buildTree = (array: IIssueLabel[], parent = null) => {
  const tree: IIssueLabelTree[] = [];

  array.forEach((item: any) => {
    if (item.parent === parent) {
      const children = buildTree(array, item.id);
      item.children = children;
      tree.push(item);
    }
  });

  return tree;
};

/**
 * @description Returns valid keys from object whose value is not falsy
 * @param {any} obj Object to check
 * @returns {string[]} Array of valid keys
 * @example
 * getValidKeysFromObject({a: 1, b: 0, c: null}) // returns ['a']
 */
export const getValidKeysFromObject = (obj: any) => {
  if (!obj || isEmpty(obj) || typeof obj !== "object" || Array.isArray(obj)) return [];

  return Object.keys(obj).filter((key) => !!obj[key]);
};

/**
 * @description Converts an array of strings into an object with boolean true values
 * @param {string[]} arrayStrings Array of strings
 * @returns {Object} Object with string keys and boolean values
 * @example
 * convertStringArrayToBooleanObject(['a', 'b']) // returns {a: true, b: true}
 */
export const convertStringArrayToBooleanObject = (arrayStrings: string[]) => {
  const obj: { [key: string]: boolean } = {};

  for (const arrayString of arrayStrings) {
    obj[arrayString] = true;
  }

  return obj;
};
