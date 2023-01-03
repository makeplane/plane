import { useCommands, useActive } from "@remirror/react";

export const StrikeButton = () => {
  const { toggleStrike } = useCommands();

  const active = useActive();

  return (
    <button
      type="button"
      onClick={toggleStrike}
      className={`${active.strike() ? "bg-gray-200" : "hover:bg-gray-100"} rounded p-1`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        fill="currentColor"
        className="bi bi-type-strikethrough"
        viewBox="0 0 16 16"
      >
        <path d="M6.333 5.686c0 .31.083.581.27.814H5.166a2.776 2.776 0 0 1-.099-.76c0-1.627 1.436-2.768 3.48-2.768 1.969 0 3.39 1.175 3.445 2.85h-1.23c-.11-1.08-.964-1.743-2.25-1.743-1.23 0-2.18.602-2.18 1.607zm2.194 7.478c-2.153 0-3.589-1.107-3.705-2.81h1.23c.144 1.06 1.129 1.703 2.544 1.703 1.34 0 2.31-.705 2.31-1.675 0-.827-.547-1.374-1.914-1.675L8.046 8.5H1v-1h14v1h-3.504c.468.437.675.994.675 1.697 0 1.826-1.436 2.967-3.644 2.967z" />{" "}
      </svg>
    </button>
  );
};
