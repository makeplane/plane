export const usePlatformOS = () => {
  const userAgent = window.navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

  return { isMobile };
};
