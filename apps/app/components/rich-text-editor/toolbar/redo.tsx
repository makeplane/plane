import { useCommands } from "@remirror/react";

export const RedoButton = () => {
  const { redo } = useCommands();
  return (
    <button
      type="button"
      onClick={() => {
        redo();
      }}
      className="rounded p-1 hover:bg-gray-100"
    >
      <svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 48 48">
        <path d="M19.6 38q-4.75 0-8.175-3.2Q8 31.6 8 26.9t3.425-7.9q3.425-3.2 8.175-3.2h14.7l-5.7-5.7L30.7 8l9.3 9.3-9.3 9.3-2.1-2.1 5.7-5.7H19.55q-3.5 0-6.025 2.325Q11 23.45 11 26.9t2.525 5.775Q16.05 35 19.55 35H34v3Z" />
      </svg>
    </button>
  );
};
