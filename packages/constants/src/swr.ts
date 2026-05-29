export const DEFAULT_SWR_CONFIG = {
  refreshWhenHidden: false,
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnMount: true,
  refreshInterval: 600000,
  errorRetryCount: 3,
};

export const WEB_SWR_CONFIG = {
  refreshWhenHidden: false,
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnMount: true,
  errorRetryCount: 3,
};
