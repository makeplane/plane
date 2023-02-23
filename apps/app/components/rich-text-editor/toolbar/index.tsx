// buttons
import {
  ToggleBoldButton,
  ToggleItalicButton,
  ToggleUnderlineButton,
  ToggleStrikeButton,
  ToggleOrderedListButton,
  ToggleBulletListButton,
  RedoButton,
  UndoButton,
} from "@remirror/react";
// headings
import HeadingControls from "./heading-controls";

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
      <ToggleOrderedListButton />
      <ToggleBulletListButton />
    </div>
  </div>
);
