// history
import { RedoButton } from "./redo";
import { UndoButton } from "./undo";
// formats
import { BoldButton } from "./bold";
import { ItalicButton } from "./italic";
import { UnderlineButton } from "./underline";
import { StrikeButton } from "./strike";
import { LinkButton } from "./link";
// headings
import { Heading1Button } from "./heading-1";
import { Heading2Button } from "./heading-2";
import { Heading3Button } from "./heading-3";
// list
import { OrderedListButton } from "./ordered-list";
import { UnorderedListButton } from "./unordered-list";

export const RichTextToolbar: React.FC = () => {
  return (
    <div className="flex flex-row items-center gap-x-5">
      <UndoButton />
      <RedoButton />
      <BoldButton />
      <ItalicButton />
      <UnderlineButton />
      <StrikeButton />
      <LinkButton />
      <Heading1Button />
      <Heading2Button />
      <Heading3Button />
      <OrderedListButton />
      <UnorderedListButton />
    </div>
  );
};
