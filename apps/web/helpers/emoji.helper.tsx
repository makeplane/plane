/**
 * Renders an emoji or icon
 * @param {string | { name: string; color: string }} emoji - The emoji or icon to render
 * @returns {React.ReactNode} The rendered emoji or icon
 */
export const renderEmoji = (
  emoji:
    | string
    | {
        name: string;
        color: string;
      }
): React.ReactNode => {
  if (!emoji) return;

  if (typeof emoji === "object")
    return (
      <span style={{ fontSize: "16px", color: emoji.color }} className="material-symbols-rounded">
        {emoji.name}
      </span>
    );
  else return isNaN(parseInt(emoji)) ? emoji : String.fromCodePoint(parseInt(emoji));
};
