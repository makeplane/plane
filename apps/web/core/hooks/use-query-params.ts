import { useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";

type TParamsToAdd = {
  [key: string]: string;
};

export const useQueryParams = () => {
  // next navigation
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const updateQueryParams = useCallback(
    ({ paramsToAdd = {}, paramsToRemove = [] }: { paramsToAdd?: TParamsToAdd; paramsToRemove?: string[] }) => {
      const currentParams = new URLSearchParams(searchParams.toString());

      // add or update query parameters
      Object.keys(paramsToAdd).forEach((key) => {
        currentParams.set(key, paramsToAdd[key]);
      });

      // remove specified query parameters
      paramsToRemove.forEach((key) => {
        currentParams.delete(key);
      });

      // construct the new route with the updated query parameters
      const query = currentParams.toString();
      const newRoute = query ? `${pathname}?${query}` : pathname;
      return newRoute;
    },
    [pathname, searchParams]
  );

  return {
    updateQueryParams,
  };
};
