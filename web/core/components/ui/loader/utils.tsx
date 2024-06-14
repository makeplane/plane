export const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const getRandomLength = (lengthArray: string[]) => {
  const randomIndex = Math.floor(Math.random() * lengthArray.length);
  return `${lengthArray[randomIndex]}`;
};
