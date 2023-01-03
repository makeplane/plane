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
// table
import { TableControls } from "./table-controls";

export const RichTextToolbar: React.FC = () => {
  return (
    <div className="flex items-center gap-y-2 divide-x">
      <div className="flex items-center gap-x-1 px-2">
        <UndoButton />
        <RedoButton />
      </div>
      <div className="flex items-center gap-x-1 px-2">
        <Heading1Button />
        <Heading2Button />
        <Heading3Button />
      </div>
      <div className="flex items-center gap-x-1 px-2">
        <BoldButton />
        <ItalicButton />
        <UnderlineButton />
        <StrikeButton />
      </div>
      <div className="flex items-center gap-x-1 px-2">
        <OrderedListButton />
        <UnorderedListButton />
      </div>
      <div className="flex items-center gap-x-1 px-2">
        <TableControls />
      </div>
      <div className="flex items-center gap-x-1 px-2">
        <LinkButton />
      </div>
    </div>
  );
};
