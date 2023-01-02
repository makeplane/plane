import { useCommands, useActive } from "@remirror/react";

export const Heading1Button = () => {
  const { toggleHeading, focus } = useCommands();

  const active = useActive();

  return (
    <button
      onClick={() => {
        toggleHeading({ level: 1 });
        focus();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="22"
        width="22"
        fill={active.heading({ level: 1 }) ? "rgb(99 ,102 ,241 ,1)" : "black"}
        viewBox="0 0 48 48"
      >
        <path d="M10 34V14h3v8.5h9V14h3v20h-3v-8.5h-9V34Zm25 0V17h-4v-3h7v20Z" />
      </svg>
    </button>
  );
};
