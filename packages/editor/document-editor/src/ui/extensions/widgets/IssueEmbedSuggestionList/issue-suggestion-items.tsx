import { IIssueListSuggestion } from ".";

export const getIssueSuggestionItems = (
  issueSuggestions: Array<IIssueListSuggestion>,
) => {
  return ({ query }: { query: string }) => {
    const search = query.toLowerCase();
    const filteredSuggestions = issueSuggestions.filter((item) => {
      return (
        item.title.toLowerCase().includes(search) ||
        item.identifier.toLowerCase().includes(search) ||
        item.priority.toLowerCase().includes(search)
      );
    });

    return filteredSuggestions;
  };
};
