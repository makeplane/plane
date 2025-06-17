export const generateQueryParams = (searchParams: URLSearchParams, excludedParamKeys?: string[]): string => {
  const params = new URLSearchParams(searchParams);
  excludedParamKeys &&
    excludedParamKeys.forEach((key) => {
      params.delete(key);
    });
  return params.toString();
};
