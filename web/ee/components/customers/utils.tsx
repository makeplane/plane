export const getAbbreviatedNumber = (n: number) => {
  if (n >= 1e6) {
    return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1e3) {
    return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return n;
};
