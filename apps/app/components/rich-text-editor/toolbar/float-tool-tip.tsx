// buttons
import {
  ToggleBoldButton,
  ToggleItalicButton,
  ToggleUnderlineButton,
  ToggleStrikeButton,
  ToggleOrderedListButton,
  ToggleBulletListButton,
  ToggleCodeButton,
  ToggleHeadingButton,
  useActive,
} from "@remirror/react";
import { EditorState } from "remirror";

type Props = {
  gptOption?: boolean;
  editorState: Readonly<EditorState>;
};

export const CustomFloatingToolbar: React.FC<Props> = ({ gptOption, editorState }) => {
  const active = useActive();

  return (
    <div className="z-[99999] flex items-center gap-y-2 divide-x divide-brand-base rounded border border-brand-base bg-brand-surface-2 p-1 px-0.5 shadow-md">
      <div className="flex items-center gap-x-1 px-2">
        <ToggleHeadingButton
          attrs={{
            level: 1,
          }}
        />
        <ToggleHeadingButton
          attrs={{
            level: 2,
          }}
        />
        <ToggleHeadingButton
          attrs={{
            level: 3,
          }}
        />
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
      {gptOption && (
        <div className="flex items-center gap-x-1 px-2">
          <button
            type="button"
            className="rounded py-1 px-1.5 text-xs hover:bg-brand-surface-1"
            onClick={() => console.log(editorState.selection.$anchor.nodeBefore)}
          >
            AI
          </button>
        </div>
      )}
      <div className="flex items-center gap-x-1 px-2">
        <ToggleCodeButton />
      </div>
    </div>
  );
};
