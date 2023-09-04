export const saveRecentEmoji = (emoji: string) => {
  const recentEmojis = localStorage.getItem("recentEmojis");
  if (recentEmojis) {
    const recentEmojisArray = recentEmojis.split(",");
    if (recentEmojisArray.includes(emoji)) {
      const index = recentEmojisArray.indexOf(emoji);
      recentEmojisArray.splice(index, 1);
    }
    recentEmojisArray.unshift(emoji);
    if (recentEmojisArray.length > 18) {
      recentEmojisArray.pop();
    }
    localStorage.setItem("recentEmojis", recentEmojisArray.join(","));
  } else {
    localStorage.setItem("recentEmojis", emoji);
  }
};

export const getRecentEmojis = () => {
  const recentEmojis = localStorage.getItem("recentEmojis");
  if (recentEmojis) {
    const recentEmojisArray = recentEmojis.split(",");
    return recentEmojisArray;
  }
  return [];
};
