export const debounce = (func: any, wait: number, immediate: boolean = false) => {
  let timeout: any;
  return function executedFunction(...args: any) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

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
