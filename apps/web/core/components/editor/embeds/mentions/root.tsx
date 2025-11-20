// plane web imports
import type { TEditorMentionComponentProps } from "@/plane-web/components/editor/embeds/mentions";
import { EditorAdditionalMentionsRoot } from "@/plane-web/components/editor/embeds/mentions";
// local imports
import { EditorUserMention } from "./user";

export function EditorMentionsRoot(props: TEditorMentionComponentProps) {
  const { entity_identifier, entity_name } = props;

  switch (entity_name) {
    case "user_mention":
      return <EditorUserMention id={entity_identifier} />;
    default:
      return <EditorAdditionalMentionsRoot {...props} />;
  }
}
