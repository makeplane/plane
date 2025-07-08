import { useMemo } from "react";

type QueryParams<T extends string> = {
  [key in T]: string;
};

export function useQueryParams<T extends string>(paramNames: Array<T>): QueryParams<T> {
  return useMemo(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const params = {} as QueryParams<T>;
    paramNames.forEach((name) => {
      params[name] = urlParams.get(name) ?? "";
    });

    return params;
  }, [paramNames]);
}

export default useQueryParams;
