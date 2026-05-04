/**
 * .env.e2e から必須変数を読み出す。
 * playwright.config.ts で既に dotenv.config() 済みなので process.env を参照するだけ。
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. ` +
        `Copy apps/web/e2e/.env.e2e.example to apps/web/e2e/.env.e2e and fill values. ` +
        `See apps/web/e2e/README.md.`
    );
  }
  return value;
}

export const env = {
  baseURL: required("E2E_BASE_URL"),
  apiBaseURL: required("E2E_API_BASE_URL"),
  userEmail: required("E2E_USER_EMAIL"),
  userPassword: required("E2E_USER_PASSWORD"),
  workspaceSlug: required("E2E_WORKSPACE_SLUG"),
  projectId: required("E2E_PROJECT_ID"),
};
