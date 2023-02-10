// buttons
import {
  ToggleBoldButton,
  ToggleItalicButton,
  ToggleUnderlineButton,
  ToggleStrikeButton,
  RedoButton,
  UndoButton,
} from "@remirror/react";
// headings
import HeadingControls from "./heading-controls";
// list
import { OrderedListButton } from "./ordered-list";
import { UnorderedListButton } from "./unordered-list";

export const RichTextToolbar: React.FC = () => (
  <div className="flex items-center gap-y-2 divide-x">
    <div className="flex items-center gap-x-1 px-2">
      <RedoButton />
      <UndoButton />
    </div>
    <div className="px-2">
      <HeadingControls />
    </div>
    <div className="flex items-center gap-x-1 px-2">
      <ToggleBoldButton />
      <ToggleItalicButton />
      <ToggleUnderlineButton />
      <ToggleStrikeButton />
    </div>
    <div className="flex items-center gap-x-1 px-2">
      <OrderedListButton />
      <UnorderedListButton />
    </div>
    {/* <div className="flex items-center gap-x-1 px-2">
      <LinkButton />
    </div> */}
  </div>
);
