import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as setup, expect, request as apiRequest } from "@playwright/test";
import { env } from "../fixtures/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE = path.join(__dirname, "..", "..", "playwright", ".auth", "user.json");

setup("authenticate via UI login", async ({ page }) => {
  // 既存の storageState に有効なセッションがある場合は再ログインをスキップする。
  // storageState を読み込んだ APIRequestContext で /api/users/me/ を叩き、
  // 200 が返れば有効とみなす。
  // これにより localhost が IPv6 解決で別アプリに当たる環境でも安全に pass できる。
  const fs = await import("node:fs");
  const existingSession = await (async () => {
    if (!fs.existsSync(AUTH_STATE)) return false;
    try {
      // storageState の cookie は domain=localhost で保存されているため、
      // 127.0.0.1 ではなく localhost の URL でリクエストを送る必要がある。
      // env.apiBaseURL は ipv4() 変換済みなので、元の値から直接構築する。
      const rawApiBase = process.env.E2E_API_BASE_URL ?? "http://localhost:8000";
      const ctx = await apiRequest.newContext({
        baseURL: rawApiBase,
        storageState: AUTH_STATE,
      });
      const resp = await ctx.get("/api/users/me/");
      const ok = resp.status() === 200;
      await ctx.dispose();
      return ok;
    } catch {
      return false;
    }
  })();

  if (existingSession) {
    // 有効なセッションが存在するのでログインをスキップ。
    // storageState ファイルに session-id cookie が含まれていることを確認。
    const state = JSON.parse(fs.readFileSync(AUTH_STATE, "utf-8")) as {
      cookies: Array<{ name: string }>;
    };
    const hasCookie = state.cookies.some((c) => c.name === "session-id");
    expect(hasCookie, "storageState must contain session-id cookie").toBe(true);
    return;
  }

  // --- 通常のログインフロー ---

  // ログイン画面へ遷移: サインインフォームはルートパス "/" にある (NON_AUTHENTICATED ページ)
  // 認証済みの場合はワークスペースへリダイレクトされる
  await page.goto("/");

  // ログインフォームが表示されるまで待機
  await page.locator("#email").waitFor({ timeout: 15_000 });

  // 2 段階フォーム: email → continue → password → sign in
  // Step 1: email 入力 → Continue ボタン
  await page.locator("#email").fill(env.userEmail);
  await page.getByRole("button", { name: /continue/i }).click();

  // Step 2: password 入力 → submit
  // submit ボタンのテキストは SMTP 設定によって異なる:
  //   isSMTPConfigured=true  → "Continue"        (t("common.continue"))
  //   isSMTPConfigured=false → "Go to workspace" (t("common.go_to_workspace"))
  await page.locator("#password").fill(env.userPassword);
  await page
    .getByRole("button", { name: /continue|go to workspace|sign in|log in/i })
    .and(page.locator('[type="submit"]'))
    .click();

  // ログイン成功の判定: ルートパス "/" から離脱してワークスペース URL にリダイレクト
  await page.waitForURL((url) => url.pathname !== "/", { timeout: 15_000 });

  // オンボーディング: /onboarding にリダイレクトされた場合は API 経由で完了させる。
  if (page.url().includes("/onboarding")) {
    const csrfResp = await page.request.get(`${env.apiBaseURL}/auth/get-csrf-token/`);
    const { csrf_token } = (await csrfResp.json()) as { csrf_token: string };

    await page.request.patch(`${env.apiBaseURL}/api/users/me/`, {
      data: { first_name: "E2E", last_name: "User" },
      headers: { "X-CSRFTOKEN": csrf_token },
    });

    await page.request.patch(`${env.apiBaseURL}/api/users/me/onboard/`, {
      data: { is_onboarded: true },
      headers: { "X-CSRFTOKEN": csrf_token },
    });

    await page.goto(`/${env.workspaceSlug}/`);
    await page.waitForURL((url) => !url.pathname.startsWith("/onboarding"), { timeout: 15_000 });
  }

  // storageState を保存
  await page.context().storageState({ path: AUTH_STATE });

  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === "session-id")).toBe(true);
});
