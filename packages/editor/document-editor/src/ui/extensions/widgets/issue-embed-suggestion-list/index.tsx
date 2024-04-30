import { Editor, Range } from "@tiptap/react";
import { IssueEmbedSuggestions } from "src/ui/extensions/widgets/issue-embed-suggestion-list/issue-suggestion-extension";
import { getIssueSuggestionItems } from "src/ui/extensions/widgets/issue-embed-suggestion-list/issue-suggestion-items";
import { IssueListRenderer } from "src/ui/extensions/widgets/issue-embed-suggestion-list/issue-suggestion-renderer";
import { v4 as uuidv4 } from "uuid";

export type CommandProps = {
  editor: Editor;
  range: Range;
};

export interface IIssueListSuggestion {
  title: string;
  priority: "high" | "low" | "medium" | "urgent";
  identifier: string;
  state: "Cancelled" | "In Progress" | "Todo" | "Done" | "Backlog";
  command: ({ editor, range }: CommandProps) => void;
}

export const IssueSuggestions = (suggestions: any[]) => {
  const mappedSuggestions: IIssueListSuggestion[] = suggestions.map((suggestion): IIssueListSuggestion => {
    const transactionId = uuidv4();
    return {
      title: suggestion.name,
      priority: suggestion.priority.toString(),
      identifier: `${suggestion.project_detail.identifier}-${suggestion.sequence_id}`,
      state: suggestion.state_detail && suggestion.state_detail.name ? suggestion.state_detail.name : "Todo",
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(range, {
            type: "issue-embed-component",
            attrs: {
              entity_identifier: suggestion.id,
              id: transactionId,
              title: suggestion.name,
              project_identifier: suggestion.project_detail.identifier,
              sequence_id: suggestion.sequence_id,
              entity_name: "issue",
            },
          })
          .run();
      },
    };
  });

  return IssueEmbedSuggestions.configure({
    suggestion: {
      items: getIssueSuggestionItems(mappedSuggestions),
      render: IssueListRenderer,
    },
  });
};
