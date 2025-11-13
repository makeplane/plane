// plane editor
import type { TCallbackMentionComponentProps } from "@plane/editor";
// plane web components
import { EditorAdditionalMentionsRoot } from "@/plane-web/components/editor";
// local components
import { EditorUserMention } from "./user";

export const EditorMentionsRoot: React.FC<TCallbackMentionComponentProps> = (props) => {
  const { entity_identifier, entity_name } = props;

  switch (entity_name) {
    case "user_mention":
      return <EditorUserMention id={entity_identifier} />;
    default:
      return <EditorAdditionalMentionsRoot {...props} />;
  }
};
