import { IIssueListSuggestion } from ".";

export const getIssueSuggestionItems =
  (
    issueSuggestions: Array<IIssueListSuggestion>
  ) => {
    return ({ query }: { query: string }) => {
      const filteredSuggestions = issueSuggestions.filter((item) => {
        if (typeof query === "string" && query.length > 0) {
          const search = query.toLowerCase();

          return (
            item.title.toLowerCase().includes(search) ||
            item.identifier.toLowerCase().includes(search) ||
            item.priority.toLowerCase().includes(search) ||
            (item.searchTerms &&
              item.searchTerms.some((term: string) => term.includes(search)))
          );
        }
        return true;
      });

      return filteredSuggestions
    }
	}
