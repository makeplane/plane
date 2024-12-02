export const generateRandomColor = (string: string): string => {
  if (!string) return "rgb(var(--color-primary-100))";

  string = `${string}`;

  const uniqueId = string.length.toString() + string; // Unique identifier based on string length
  const combinedString = uniqueId + string;

  const hash = Array.from(combinedString).reduce((acc, char) => {
    const charCode = char.charCodeAt(0);
    return (acc << 5) - acc + charCode;
  }, 0);

  const hue = hash % 360;
  const saturation = 70; // Higher saturation for pastel colors
  const lightness = 60; // Mid-range lightness for pastel colors

  const randomColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return randomColor;
};

export const checkURLValidity = (url: string): boolean => {
  if (!url) return false;

  // regex to support complex query parameters and fragments
  const urlPattern =
    /^(https?:\/\/)?((([a-z\d-]+\.)*[a-z\d-]+\.[a-z]{2,6})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(:\d+)?(\/[\w.-]*)*(\?[^#\s]*)?(#[\w-]*)?$/i;

  return urlPattern.test(url);
};