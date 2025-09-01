import isEmpty from "lodash/isEmpty";
import { IIssueLabel, IIssueLabelTree } from "@plane/types";

export const groupBy = (array: any[], key: string) => {
  const innerKey = key.split("."); // split the key by dot
  return array.reduce((result, currentValue) => {
    const key = innerKey.reduce((obj, i) => obj?.[i], currentValue) ?? "None"; // get the value of the inner key
    (result[key] = result[key] || []).push(currentValue);
    return result;
  }, {});
};

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

export const checkDuplicates = (array: any[]) => new Set(array).size !== array.length;

export const findStringWithMostCharacters = (strings: string[]): string => {
  if (!strings || strings.length === 0) return "";

  return strings.reduce((longestString, currentString) =>
    currentString.length > longestString.length ? currentString : longestString
  );
};

export const checkIfArraysHaveSameElements = (arr1: any[] | null, arr2: any[] | null): boolean => {
  if (!arr1 || !arr2) return false;
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  if (arr1.length === 0 && arr2.length === 0) return true;

  return arr1.length === arr2.length && arr1.every((e) => arr2.includes(e));
};

type GroupedItems<T> = { [key: string]: T[] };

export const groupByField = <T>(array: T[], field: keyof T): GroupedItems<T> =>
  array.reduce((grouped: GroupedItems<T>, item: T) => {
    const key = String(item[field]);
    grouped[key] = (grouped[key] || []).concat(item);
    return grouped;
  }, {});

export const sortByField = (array: any[], field: string): any[] =>
  array.sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0));

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
 * Returns Valid keys from object whose value is not falsy
 * @param obj
 * @returns
 */
export const getValidKeysFromObject = (obj: any) => {
  if (!obj || isEmpty(obj) || typeof obj !== "object" || Array.isArray(obj)) return [];

  return Object.keys(obj).filter((key) => !!obj[key]);
};

/**
 * Convert an array into an object of keys and boolean strue
 * @param arrayStrings
 * @returns
 */
export const convertStringArrayToBooleanObject = (arrayStrings: string[]) => {
  const obj: { [key: string]: boolean } = {};

  for (const arrayString of arrayStrings) {
    obj[arrayString] = true;
  }

  return obj;
};
