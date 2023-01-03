import { useCommands, useActive } from "@remirror/react";

export const Heading2Button = () => {
  const { toggleHeading, focus } = useCommands();

  const active = useActive();

  return (
    <button
      type="button"
      onClick={() => {
        toggleHeading({ level: 2 });
        focus();
      }}
      className={`${
        active.heading({ level: 2 }) ? "bg-gray-200" : "hover:bg-gray-100"
      } rounded p-1`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 48 48"
        fill="black"
      >
        <path d="M6 34V14h3v8.5h9V14h3v20h-3v-8.5H9V34Zm21 0v-8.5q0-1.25.875-2.125T30 22.5h9V17H27v-3h12q1.25 0 2.125.875T42 17v5.5q0 1.25-.875 2.125T39 25.5h-9V31h12v3Z" />
      </svg>
    </button>
  );
};
