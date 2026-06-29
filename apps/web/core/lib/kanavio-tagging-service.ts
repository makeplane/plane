type KanavioTaggingServiceEnv = Record<string, string | undefined>;

export const getKanavioTaggingServiceBaseUrl = (
  env: KanavioTaggingServiceEnv = process.env
): string | null => {
  const configuredUrl =
    env.KANAVIO_TAGGING_SERVICE_URL?.trim() ||
    env.NEXT_PUBLIC_KANAVIO_TAGGING_SERVICE_URL?.trim() ||
    "";
  const fallbackUrl = env.NODE_ENV === "development" ? "http://localhost:3015" : "";

  return (configuredUrl || fallbackUrl).replace(/\/+$/g, "") || null;
};

export const getKanavioTaggingServiceToken = (
  env: KanavioTaggingServiceEnv = process.env
): string | null => {
  const configuredToken = env.KANAVIO_TAGGING_SERVICE_TOKEN?.trim() || "";

  return configuredToken || null;
};

export const getKanavioTaggingServiceHeaders = (
  headers: Record<string, string> = {},
  env: KanavioTaggingServiceEnv = process.env
): Record<string, string> => {
  const token = getKanavioTaggingServiceToken(env);

  return {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
};
