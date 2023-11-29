import { Editor, Range } from "@tiptap/react";
import { IssueEmbedSuggestions } from "./issue-suggestion-extension";
import { getIssueSuggestionItems } from "./issue-suggestion-items";
import { IssueListRenderer } from "./issue-suggestion-renderer";

export type CommandProps = {
  editor: Editor;
  range: Range;
}

export interface IIssueListSuggestion {
  title: string;
  searchTerms: string[];
	priority: "high" | "low" | "medium" | "urgent" | "none",
	identifier: string,
	state: "Cancelled" | "In Progress" | "Todo" | "Done" | "Backlog",
  command: ({ editor, range }: CommandProps) => void;
}

export const IssueSuggestions = (suggestions: any[]) => {

  const mappedSuggestions: IIssueListSuggestion[] = suggestions.map((suggestion): IIssueListSuggestion => {
    return {
      title: suggestion.name,
			priority: suggestion.priority,
			identifier: `${suggestion.project_detail.identifier}-${suggestion.sequence_id}`,
      searchTerms: [suggestion.name],
			state: suggestion.state_detail.name,
      command: (({ editor, range }) => {
        editor.chain().focus().insertContentAt(range, {
          type: "issue-embed-component",
          attrs: {
						entity_identifier: suggestion.id
          }
        }).run()
      })
    }
  })

	console.log(mappedSuggestions)

  return IssueEmbedSuggestions.configure({
    suggestion: {
      items: getIssueSuggestionItems(mappedSuggestions),
      render: IssueListRenderer
    }
  })
}
