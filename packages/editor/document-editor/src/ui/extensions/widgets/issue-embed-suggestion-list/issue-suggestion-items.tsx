import { IIssueListSuggestion } from "src/ui/extensions/widgets/issue-embed-suggestion-list";

export const getIssueSuggestionItems =
  (issueSuggestions: Array<IIssueListSuggestion>) =>
  ({ query }: { query: string }) => {
    const search = query.toLowerCase();
    const filteredSuggestions = issueSuggestions.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.identifier.toLowerCase().includes(search) ||
        item.priority.toLowerCase().includes(search)
    );

    return filteredSuggestions;
  };
