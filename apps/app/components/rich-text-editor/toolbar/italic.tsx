import { useCommands, useActive } from "@remirror/react";

export const ItalicButton = () => {
  const { toggleItalic, focus } = useCommands();

  const active = useActive();

  return (
    <button
      type="button"
      onClick={() => {
        toggleItalic();
        focus();
      }}
      className={`${active.italic() ? "bg-gray-200" : "hover:bg-gray-100"} rounded p-1`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="18"
        width="18"
        viewBox="0 0 48 48"
        fill="black"
      >
        <path d="M10 40v-5h6.85l8.9-22H18V8h20v5h-6.85l-8.9 22H30v5Z" />
      </svg>
    </button>
  );
};
