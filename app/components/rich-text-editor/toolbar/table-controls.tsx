import { useCommands } from "@remirror/react";

export const TableControls = () => {
  const { createTable, ...commands } = useCommands();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => createTable({ rowsCount: 3, columnsCount: 3, withHeaderRow: false })}
        className="rounded p-1 hover:bg-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-table"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          stroke="#2c3e50"
          fill="none"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <line x1="4" y1="10" x2="20" y2="10" />
          <line x1="10" y1="4" x2="10" y2="20" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => commands.deleteTable()}
        className="rounded p-1 hover:bg-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-trash"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="#2c3e50"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        </svg>
      </button>
    </div>
  );
};
