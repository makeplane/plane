export const renderEmoji = (
  emoji:
    | string
    | {
        name: string;
        color: string;
      }
) => {
  if (!emoji) return;

  if (typeof emoji === "object")
    return (
      <span style={{ color: emoji.color }} className="material-symbols-rounded text-16">
        {emoji.name}
      </span>
    );
  else return isNaN(parseInt(emoji)) ? emoji : String.fromCodePoint(parseInt(emoji));
};

export const groupReactions = <T extends { reaction: string }>(reactions: T[], key: string) => {
  const groupedReactions = reactions.reduce(
    (acc: { [key: string]: T[] }, reaction: any) => {
      if (!acc[reaction[key]]) {
        acc[reaction[key]] = [];
      }
      acc[reaction[key]].push(reaction);
      return acc;
    },
    {} as { [key: string]: T[] }
  );

  return groupedReactions;
};
