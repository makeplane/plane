// types
import { IIssueFilterOptions } from "@plane/types";

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

