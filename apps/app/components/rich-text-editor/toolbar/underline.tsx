import { useCommands, useActive } from "@remirror/react";

export const UnderlineButton = () => {
  const { toggleUnderline, focus } = useCommands();

  const active = useActive();

  return (
    <button
      type="button"
      onClick={() => {
        toggleUnderline();
        focus();
      }}
      className={`${active.underline() ? "bg-gray-200" : "hover:bg-gray-100"} rounded p-1`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        fill="black"
        viewBox="0 0 48 48"
      >
        <path d="M10 42v-3h28v3Zm14-8q-5.05 0-8.525-3.45Q12 27.1 12 22.1V6h4v16.2q0 3.3 2.3 5.55T24 30q3.4 0 5.7-2.25Q32 25.5 32 22.2V6h4v16.1q0 5-3.475 8.45Q29.05 34 24 34Z" />
      </svg>
    </button>
  );
};
