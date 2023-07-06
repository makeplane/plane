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

export const renderEmoji = (emoji: string) => {
  if (!emoji) return;

  return isNaN(parseInt(emoji)) ? emoji : String.fromCodePoint(parseInt(emoji));
};
