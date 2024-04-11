import { v4 as uuidv4 } from "uuid";
import { IMentionSuggestion } from "src/types/mention-suggestion";

export const getSuggestionItems =
  (suggestions: IMentionSuggestion[]) =>
  ({ query }: { query: string }) => {
    const mappedSuggestions: IMentionSuggestion[] = suggestions.map((suggestion): IMentionSuggestion => {
      const transactionId = uuidv4();
      return {
        ...suggestion,
        id: transactionId,
      };
    });
    return mappedSuggestions
      .filter((suggestion) => suggestion.title.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5);
  };
