import { useCommands, useActive } from "@remirror/react";

export const ItalicButton = () => {
  const { toggleItalic, focus } = useCommands();

  const active = useActive();

  return (
    <button
      onClick={() => {
        toggleItalic();
        focus();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="22"
        width="22"
        viewBox="0 0 48 48"
        fill={active.italic() ? "rgb(99 ,102 ,241 ,1)" : "black"}
      >
        <path d="M10 40v-5h6.85l8.9-22H18V8h20v5h-6.85l-8.9 22H30v5Z" />
      </svg>
    </button>
  );
};
