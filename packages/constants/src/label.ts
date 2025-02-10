export const LABEL_COLOR_OPTIONS = [
  "#FF6900",
  "#FCB900",
  "#7BDCB5",
  "#00D084",
  "#8ED1FC",
  "#0693E3",
  "#ABB8C3",
  "#EB144C",
  "#F78DA7",
  "#9900EF",
];

export const getRandomLabelColor = () => {
  const randomIndex = Math.floor(Math.random() * LABEL_COLOR_OPTIONS.length);
  return LABEL_COLOR_OPTIONS[randomIndex];
};
