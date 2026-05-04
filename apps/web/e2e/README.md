# Plane Web E2E (Playwright)

Issue Gantt の依存関係ドラッグ機能(commit `f01289047c`)の回帰防止を目的とする E2E テスト。
設計ドキュメント: `docs/timeline-e2e-test-environment.md`

## 初回セットアップ(手動、約 5 分)

1. 既定のローカル開発スタックを起動:
   ```bash
   docker compose -f docker-compose-local.yml up
   ```
2. 別ターミナルで web サーバを起動:
   ```bash
   pnpm dev
   ```
3. `http://localhost:3001/god-mode/` を開き、instance admin を登録(初回のみ、以降の開発と共用可)。
4. `http://localhost:3000` でテスト用ユーザーを作成:
   - メール: `e2e-user@example.com`
   - パスワード: 任意
5. ワークスペース `e2e-workspace`(slug も同じ)を作成。
6. プロジェクトを作成(任意名)。URL の UUID(`projects/<uuid>/...`)を控える。
7. プロジェクトの Issues ページを開き、layout を **Gantt** に切り替える(以降は user preference として保持される)。
8. `.env.e2e.example` をコピーして値を記入:
   ```bash
   cp apps/web/e2e/.env.e2e.example apps/web/e2e/.env.e2e
   # エディタで E2E_USER_PASSWORD と E2E_PROJECT_ID を更新
   ```

## 実行

```bash
# ヘッドレス実行(通常)
pnpm --filter=web test:e2e

# UI モード(デバッグ向け、GUI で各ステップを追える)
pnpm --filter=web test:e2e:ui

# デバッグ(breakpoint でステップ実行)
pnpm --filter=web test:e2e:debug
```

失敗時は `apps/web/playwright-report/` に HTML レポートが生成される。
trace / video は `apps/web/test-results/` に保存(`playwright.config.ts` の `trace`/`video` 設定参照)。

## 前提

- docker-compose-local.yml が up 状態であること
- `pnpm dev` で web:3000 が起動していること
- `.env.e2e` が正しく記入されていること
- **UI 言語 = `en`**: `timeline-dependency-propagation.spec.ts`(TEST-24)はトーストの英語文字列をアサートするため、テスト用ワークスペースの UI 言語を English に設定してください(`ja` で実行すると失敗します — D-04b / D-08a)。

テストは web サーバを自分で起動しない。別ターミナルで `pnpm dev` を維持。
