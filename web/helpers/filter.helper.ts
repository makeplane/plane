// types
import { IIssueFilterOptions } from "types";

export const calculateTotalFilters = (filters: IIssueFilterOptions): number =>
  filters && Object.keys(filters).length > 0
    ? Object.keys(filters)
        .map((key) =>
          filters[key as keyof IIssueFilterOptions] !== null
            ? isNaN((filters[key as keyof IIssueFilterOptions] as string[]).length)
              ? 0
              : (filters[key as keyof IIssueFilterOptions] as string[]).length
            : 0
        )
        .reduce((curr, prev) => curr + prev, 0)
    : 0;

// check if there is any difference between the saved filters and the current filters
export const areFiltersDifferent = (filtersSet1: IIssueFilterOptions, filtersSet2: IIssueFilterOptions) => {
  for (const [key, value] of Object.entries(filtersSet1) as [keyof IIssueFilterOptions, string[] | null][]) {
    if (value) {
      if (Array.isArray(value) && Array.isArray(filtersSet2[key])) {
        if (value.length !== filtersSet2[key]?.length) return true;

        for (let i = 0; i < value.length; i++) {
          if (!filtersSet2[key]?.includes(value[i])) return true;
        }
      } else if (value !== filtersSet2[key]) return true;
    }
  }

  return false;
};
