export const getRandomEmoji = () => {
  const emojis = [
    "8986",
    "9200",
    "128204",
    "127773",
    "127891",
    "127947",
    "128076",
    "128077",
    "128187",
    "128188",
    "128512",
    "128522",
    "128578",
  ];

  return emojis[Math.floor(Math.random() * emojis.length)];
};

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
      <span style={{ color: emoji.color }} className="material-symbols-rounded text-lg">
        {emoji.name}
      </span>
    );
  else return isNaN(parseInt(emoji)) ? emoji : String.fromCodePoint(parseInt(emoji));
};
