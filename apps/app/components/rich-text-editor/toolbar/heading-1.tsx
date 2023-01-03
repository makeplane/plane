import { useCommands, useActive } from "@remirror/react";

export const Heading1Button = () => {
  const { toggleHeading, focus } = useCommands();

  const active = useActive();

  return (
    <button
      type="button"
      onClick={() => {
        toggleHeading({ level: 1 });
        focus();
      }}
      className={`${
        active.heading({ level: 1 }) ? "bg-gray-200" : "hover:bg-gray-100"
      } rounded p-1`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="18"
        width="18"
        viewBox="0 0 48 48"
        fill="black"
      >
        <path d="M10 34V14h3v8.5h9V14h3v20h-3v-8.5h-9V34Zm25 0V17h-4v-3h7v20Z" />
      </svg>
    </button>
  );
};
