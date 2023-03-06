// buttons
import {
  ToggleBoldButton,
  ToggleItalicButton,
  ToggleUnderlineButton,
  ToggleStrikeButton,
  ToggleOrderedListButton,
  ToggleBulletListButton,
  ToggleCodeButton,
} from "@remirror/react";

import HeadingControls from "./heading-controls";

export const CustomFloatingToolbar: React.FC = () => (
  <div className="z-[99999] flex items-center gap-y-2 divide-x rounded border bg-white p-1 px-0.5 shadow-md">
    <div className="flex items-center gap-x-1 px-2">
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
    <div className="flex items-center gap-x-1 px-2">
      <ToggleCodeButton />
    </div>
  </div>
);
