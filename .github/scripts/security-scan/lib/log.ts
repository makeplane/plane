/* eslint-disable no-console */

export const log = {
  info: (message: string): void => {
    console.log(message);
  },
  warn: (message: string): void => {
    console.warn(message);
  },
  error: (message: string): void => {
    console.error(message);
  },
};
