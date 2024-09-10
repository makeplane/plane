import { useSearchParams, usePathname } from "next/navigation";

type TParamsToAdd = {
  [key: string]: string;
};

export const useQueryParams = () => {
  // next navigation
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const updateQueryParams = ({
    paramsToAdd = {},
    paramsToRemove = [],
  }: {
    paramsToAdd?: TParamsToAdd;
    paramsToRemove?: string[];
  }) => {
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
    const newRoute = `${pathname}?${currentParams.toString()}`;
    return newRoute;
  };

  return {
    updateQueryParams,
  };
};
