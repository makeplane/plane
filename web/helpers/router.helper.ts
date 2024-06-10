import { ReadonlyURLSearchParams } from "next/navigation";

export const generateQueryParams = (searchParams: ReadonlyURLSearchParams, excludedParamKeys?: string[]): string => {
  const params = new URLSearchParams(searchParams);
  excludedParamKeys && excludedParamKeys.forEach((key) => {
    params.delete(key);
  });
  return params.toString();
};
