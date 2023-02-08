import { useCommands, useActive } from "@remirror/react";

export const UnorderedListButton = () => {
  const { toggleBulletList, focus } = useCommands();

  const active = useActive();

  return (
    <button
      type="button"
      onClick={() => {
        toggleBulletList();
        focus();
      }}
      className={`${active.bulletList() ? "bg-gray-200" : "hover:bg-gray-100"} rounded p-1`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="18"
        width="18"
        fill="black"
        viewBox="0 0 48 48"
      >
        <path d="M8.55 39q-1.05 0-1.8-.725T6 36.55q0-1.05.75-1.8t1.8-.75q1 0 1.725.75.725.75.725 1.8 0 1-.725 1.725Q9.55 39 8.55 39ZM16 38v-3h26v3ZM8.55 26.5q-1.05 0-1.8-.725T6 24q0-1.05.75-1.775.75-.725 1.8-.725 1 0 1.725.75Q11 23 11 24t-.725 1.75q-.725.75-1.725.75Zm7.45-1v-3h26v3ZM8.5 14q-1.05 0-1.775-.725Q6 12.55 6 11.5q0-1.05.725-1.775Q7.45 9 8.5 9q1.05 0 1.775.725Q11 10.45 11 11.5q0 1.05-.725 1.775Q9.55 14 8.5 14Zm7.5-1v-3h26v3Z" />
      </svg>
    </button>
  );
};
