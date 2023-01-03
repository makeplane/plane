import { useCommands, useActive } from "@remirror/react";

export const OrderedListButton = () => {
  const { toggleOrderedList, focus } = useCommands();

  const active = useActive();

  return (
    <button
      type="button"
      onClick={() => {
        toggleOrderedList();
        focus();
      }}
      className={`${active.orderedList() ? "bg-gray-200" : "hover:bg-gray-100"} rounded p-1`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 48 48"
        fill="black"
      >
        <path d="M6 40v-1.7h4.2V37H8.1v-1.7h2.1V34H6v-1.7h5.9V40Zm10.45-2.45v-3H42v3ZM6 27.85v-1.6l3.75-4.4H6v-1.7h5.9v1.6l-3.8 4.4h3.8v1.7Zm10.45-2.45v-3H42v3ZM8.1 15.8V9.7H6V8h3.8v7.8Zm8.35-2.55v-3H42v3Z" />
      </svg>
    </button>
  );
};
