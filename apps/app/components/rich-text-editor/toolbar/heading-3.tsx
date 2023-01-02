import { useCommands, useActive } from "@remirror/react";

export const Heading3Button = () => {
  const { toggleHeading, focus } = useCommands();

  const active = useActive();

  return (
    <button
      onClick={() => {
        toggleHeading({ level: 3 });
        focus();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        fill={active.heading({ level: 3 }) ? "rgb(99 ,102 ,241 ,1)" : "black"}
        viewBox="0 0 48 48"
      >
        <path d="M6 34V14h3v8.5h9V14h3v20h-3v-8.5H9V34Zm21 0v-3h12v-5.5h-8v-3h8V17H27v-3h12q1.25 0 2.125.875T42 17v14q0 1.25-.875 2.125T39 34Z" />
      </svg>
    </button>
  );
};
