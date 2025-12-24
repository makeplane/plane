import type { TCoreLoginMediums } from "@plane/types";

export const CORE_LOGIN_MEDIUM_LABELS: Record<TCoreLoginMediums, string> = {
  email: "Email",
  "magic-code": "Magic code",
  github: "GitHub",
  gitlab: "GitLab",
  google: "Google",
  gitea: "Gitea",
};
