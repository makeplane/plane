import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as setup, expect } from "@playwright/test";
import { env } from "../fixtures/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE = path.join(__dirname, "..", "..", "playwright", ".auth", "user.json");

setup("authenticate via UI login", async ({ page }) => {
  // ログイン画面へ遷移: サインインフォームはルートパス "/" にある (NON_AUTHENTICATED ページ)
  // 認証済みの場合はワークスペースへリダイレクトされる
  await page.goto("/");

  // ログインフォームが表示されるまで待機
  await page.locator("#email").waitFor({ timeout: 15_000 });

  // 2 段階フォーム: email → continue → password → sign in
  // Step 1: email 入力 → Continue ボタン
  // label for="email" の text は "Email" (auth.common.email.label)
  await page.locator("#email").fill(env.userEmail);
  await page.getByRole("button", { name: /continue/i }).click();

  // Step 2: password 入力 → submit
  // label for="password" の text は "Password" (auth.common.password.label)
  // submit ボタンのテキストは SMTP 設定によって異なる:
  //   isSMTPConfigured=true  → "Continue"        (t("common.continue"))
  //   isSMTPConfigured=false → "Go to workspace" (t("common.go_to_workspace"))
  await page.locator("#password").fill(env.userPassword);
  await page
    .getByRole("button", { name: /continue|go to workspace|sign in|log in/i })
    .first()
    .click();

  // ログイン成功の判定: ルートパス "/" から離脱してワークスペース URL にリダイレクト
  await page.waitForURL((url) => url.pathname !== "/", { timeout: 15_000 });

  // storageState を保存
  await page.context().storageState({ path: AUTH_STATE });

  // 念のためサニティチェック: session-id cookie が保存されたか
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === "session-id")).toBe(true);
});
